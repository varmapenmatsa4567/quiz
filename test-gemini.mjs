import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBvR10BH1aeg319q5xShSEzny8N2lUVj28";

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // For some reason the SDK doesn't expose listModels directly on genAI instance easily in all versions,
        // but let's try to just use a known model or check if we can hit the REST API if this fails.
        // Actually, the SDK does not have a direct listModels method on the client in some versions.
        // Let's try to just run a generation with a very standard model 'gemini-pro' and print error details if any.
        // But we already saw the error.

        // Let's try to use the model 'gemini-1.5-flash' again but maybe the issue is the API key itself or region?
        // Let's try a simple curl command via run_command to list models if possible, or just use node to fetch.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
