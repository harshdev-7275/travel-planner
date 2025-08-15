import Groq from "groq-sdk";
import { GROQ_API_KEY } from "../utils/env/env";
import logger from "./logger";

if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({ apiKey: GROQ_API_KEY });

export const getGroqChatCompletion = async (messages: any[]) => {
    try {
        const response = await groq.chat.completions.create({
            messages: messages,
            model: "moonshotai/kimi-k2-instruct",
            temperature: 0.1, // Lower temperature for more consistent tool selection
            max_tokens: 100, // Limit tokens for tool selection
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
        });
        
        const content = response.choices[0].message.content;
        logger.debug({ content }, "getGroqChatCompletion: received response");
        return content;
    } catch (error) {
        logger.error("Error in getGroqChatCompletion", error);
        throw error;
    }
}

export const getGreetingToolCompletion = async (messages: any[]) => {
    try {
        const response = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            stream: true
        });
        
        return response;
    } catch (error) {
        logger.error("Error in getGreetingToolCompletion", error);
        throw error;
    }
}


export const underStandUserQuery = async (messages: any[]) => {
    try {
        const response = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        logger.error("Error in underStandUserQuery", error);
        throw error;
    }
}