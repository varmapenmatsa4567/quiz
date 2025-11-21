import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = "AIzaSyBvR10BH1aeg319q5xShSEzny8N2lUVj28";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request) {
    try {
        const { question, correctAnswer, userAnswer } = await request.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      You are a helpful quiz tutor. Explain why the correct answer is right and (if provided and different) why the user's answer is wrong.
      
      Question: "${question}"
      Correct Answer: "${correctAnswer}"
      User's Answer: "${userAnswer || "N/A"}"
      
      Keep the explanation concise (max 2-3 sentences), friendly, and educational.
    `;

        const result = await model.generateContent(prompt);
        const explanation = result.response.text();

        return NextResponse.json({ explanation });
    } catch (error) {
        console.error("Error generating explanation:", error);
        return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
    }
}
