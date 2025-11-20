import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { topic, count } = await req.json();

        const prompt = `Generate ${count} multiple-choice questions about "${topic}". 
    Return the response ONLY as a valid JSON array of objects. 
    Each object must have:
    - "text": The question text
    - "options": An array of 4 strings (the choices)
    - "answer": The correct answer string (must match one of the options exactly)
    - "explanation": A brief explanation of why the answer is correct
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup potential markdown formatting if Gemini adds it despite instructions
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const questions = JSON.parse(text);

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Error generating quiz:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz" },
            { status: 500 }
        );
    }
}
