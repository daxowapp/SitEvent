import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { messages, eventId } = await req.json();

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        // Fetch Event Data Context
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: {
                    include: {
                        registrant: true
                    }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Calculate Stats for Context
        const totalLeads = event.registrations.length;
        const majors = event.registrations.reduce((acc, reg) => {
            const major = reg.registrant.standardizedMajor || reg.registrant.interestedMajor || "Unknown";
            acc[major] = (acc[major] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const genders = event.registrations.reduce((acc, reg) => {
            const gender = reg.registrant.gender || "Unknown";
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topMajors = Object.entries(majors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

        const systemPrompt = `You are an event data assistant for ${event.title}. 
        Here is the real-time data for this event:
        - Total Leads: ${totalLeads}
        - Gender Distribution: ${JSON.stringify(genders)}
        - Top 5 Majors: ${topMajors}
        
        Answer the user's questions about this data accurately. 
        If they ask for specific numbers, give them. 
        If they ask for insights, summarize the trends.
        Keep answers concise and professional.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ content: reply });

    } catch (error) {
        console.error("Chatbot Error:", error);
        return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
}
