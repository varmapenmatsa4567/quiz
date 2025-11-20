import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { topic, count } = await req.json();

        const prompt = `Generate ${count} multiple-choice ${topic} questions.

Return the response ONLY as a valid JSON array of objects.
Each object must contain:

"text": The question text.
If the question includes a code snippet, wrap the snippet inside a fenced code block exactly like this:


backticks and laungage in between

"options": An array of exactly 4 strings
"answer": A string that exactly matches one of the options
"explanation": A brief explanation of why that answer is correct
Do not add any extra text, messages, markdown, commentary, or explanation outside the JSON.
Return ONLY the raw JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log(text);

        // Cleanup potential markdown formatting if Gemini adds it despite instructions
        text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

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
