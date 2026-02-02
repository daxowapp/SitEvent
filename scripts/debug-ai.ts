import "dotenv/config";
import { enrichRegistrantData } from "../src/lib/ai";
import { prisma } from "../src/lib/db";

async function main() {
    console.log("--- TEST 1: Hardcoded Sample ---");
    const testName = "Sarah Ahmed";
    const testMajor = "dental surgry";
    console.log(`Input: Name="${testName}", Major="${testMajor}"`);
    
    try {
        const result = await enrichRegistrantData(testName, testMajor);
        console.log("AI Output:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test 1 Failed:", e);
    }
    
    console.log("\n--- TEST 2: Real DB Record ---");
    const lastReg = await prisma.registrant.findFirst({
        where: { interestedMajor: { not: null } },
        orderBy: { createdAt: 'desc' }
    });

    if (lastReg) {
        console.log(`Found Registrant: ${lastReg.fullName} (${lastReg.interestedMajor})`);
        console.log(`Current DB State -> Standardized: ${lastReg.standardizedMajor}, Category: ${lastReg.majorCategory}, Gender: ${lastReg.gender}`);
        
        console.log("Running AI Enrichment...");
        const dbResult = await enrichRegistrantData(lastReg.fullName, lastReg.interestedMajor);
        console.log("AI Output:", JSON.stringify(dbResult, null, 2));
    } else {
        console.log("No registrants found in DB to test.");
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
