import { groq } from "../../config/groq"
import logger from "../../config/logger"

export const getGreetingMessage = async (message: any[]) => {
    try {
        logger.debug({ messageCount: message.length }, "getGreetingMessage: creating stream");
        const response = await groq.chat.completions.create({
            messages: message,
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 1000,
            top_p: 1,
            stream: true
        });
        logger.debug("getGreetingMessage: stream created successfully");
        return response;
    } catch (error) {
        logger.error("Error in getGreetingMessage", error);
        throw error;
    }
}


