import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCaa8wlN1tx4syTR-UVnjvwLsLbpt5bAy4"; // Note: Ideally this should be an env var, but using as per instructions for now.

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export { model };
