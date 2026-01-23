import { OpenAI } from "openai";

if (!process.env.OPENAI_API_KEY) {
    console.warn("Missing OPENAI_API_KEY environment variable. AI features will not work.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_prevent_init_error",
    dangerouslyAllowBrowser: true // ONLY for development/demo if strictly needed client side, but better server side.
});

// We should run this SERVER SIDE ONLY
export async function generateUniversityContent(name: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key is missing");

    const prompt = `
    Generate detailed information for a university named "${name}".
    Return ONLY a JSON object with the following fields:
    - description: A professional description (approx 100 words)
    - website: Official website URL
    - logoUrl: URL to a high quality logo if available (or null)
    - country: The country name
    - city: The city name
    - contactEmail: General admission email
    - contactPhone: General contact phone
    - programs: An array of 5-10 popular programs/majors offered
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview", // or gpt-3.5-turbo if cost concern
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateCityContent(city: string, country: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key is missing");

    const prompt = `
    Generate travel and guide information for the city "${city}" in "${country}".
    Return ONLY a JSON object with the following fields:
    - description: Engaging description for a student traveler
    - localTips: Practical tips for students (safety, transport, etc)
    - emergencyInfo: Police, Ambulance numbers and general advice
    - attractions: Array of objects { name, description } (top 3-5 sights)
    - cafesAndFood: Array of objects { name, cuisine, priceRange } (top 3 student friendly places)
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}
