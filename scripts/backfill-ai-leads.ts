import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function enrichRegistrantData(name: string, interestedMajor: string | null) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY is not set. Skipping enrichment.");
        return { standardizedMajor: null, majorCategory: null, gender: null };
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

async function main() {
    console.log("Starting AI Backfill for Leads (Standalone Mode)...");

    let totalProcessed = 0;

    while (true) {
        // Fetch next batch
        const registrants = await prisma.registrant.findMany({
            where: {
                OR: [
                    { standardizedMajor: null },
                    { majorCategory: null },
                    { gender: null }
                ]
            },
            take: 50
        });

        if (registrants.length === 0) {
            console.log("No more registrants to process.");
            break;
        }

        console.log(`Processing batch of ${registrants.length} registrants...`);

        let batchSuccess = 0;
        let batchFail = 0;

        for (const reg of registrants) {
            // Check if we need to process (double check)
            if (reg.standardizedMajor && reg.gender && reg.majorCategory) continue;

            console.log(`[${totalProcessed + 1}] Processing: ${reg.fullName} (${reg.interestedMajor})`);

            try {
                const enriched = await enrichRegistrantData(reg.fullName, reg.interestedMajor);
                
                // Always update, even if null, to "Unknown"/"Undecided" to prevent infinite loop
                await prisma.registrant.update({
                    where: { id: reg.id },
                    data: {
                        standardizedMajor: enriched.standardizedMajor || "Undecided",
                        majorCategory: enriched.majorCategory || "Uncategorized",
                        gender: enriched.gender || "Unknown",
                    }
                });
                batchSuccess++;
            } catch (error) {
                console.error(`- Failed to process ${reg.id}:`, error);
                batchFail++;
            }
            
            // Small delay to be nice to OpenAI API
            await new Promise(r => setTimeout(r, 100)); 
            totalProcessed++;
        }
        
        console.log(`Batch outcome: ${batchSuccess} updated, ${batchFail} failed.`);
    }

    console.log(`Backfill Complete. Total processed: ${totalProcessed}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
