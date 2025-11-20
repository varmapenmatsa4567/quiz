import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBvR10BH1aeg319q5xShSEzny8N2lUVj28"; // Note: Ideally this should be an env var, but using as per instructions for now.

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export { model };
