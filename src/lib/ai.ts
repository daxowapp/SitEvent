import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EnrichmentSchema = z.object({
    standardizedMajor: z.string().nullable().describe("The standardized academic major (e.g., 'Medicine', 'Computer Science', 'Business Administration'). If ambiguous or nonsensical, null."),
    gender: z.enum(["Male", "Female"]).nullable().describe("Inferred gender based on the first name. If ambiguous or unisex, return null."),
});

export async function enrichRegistrantData(name: string, interestedMajor: string | null) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Skipping enrichment.");
        return { standardizedMajor: null, gender: null };
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a data normalization assistant. 
                    Output a JSON object with:
                    - "standardizedMajor": string or null (Standardized specific major e.g. 'Dentistry')
                    - "majorCategory": string or null (Broad Category e.g. 'Health', 'Engineering', 'Business', 'Arts', 'Science')
                    - "gender": "Male" | "Female" | null (Inferred from name)`
                },
                {
                    role: "user",
                    content: `Name: ${name}\nInterested Major: ${interestedMajor || "Not specified"}`
                }
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const result = content ? JSON.parse(content) : null;
        
        return {
            standardizedMajor: result?.standardizedMajor || null,
            majorCategory: result?.majorCategory || null,
            gender: (result?.gender === "Male" || result?.gender === "Female") ? result.gender : null
        };

    } catch (error) {
        console.error("AI Enrichment Failed:", error);
        return { standardizedMajor: null, majorCategory: null, gender: null };
    }
}
