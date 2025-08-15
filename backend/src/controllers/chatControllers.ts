import { Request, Response } from "express";
import prisma from "../config/prisma";
import { JWTPayload, verifyToken } from "../config/jwt";
import logger from "../config/logger";
import { getGroqChatCompletion, groq, underStandUserQuery } from "../config/groq";
import {  GREETING_PROMPT, TOOL_SELECTION_PROMPT, INFO_PROMPT, UNDERSTAND_USER_QUERY_PROMPT } from "../prompts/persona";
import { getAgents } from "../utils/helper/agentSelection";
import type { Tool } from "../prompts/tools";
import { getGreetingMessage } from "../utils/chats/helper";
import { webSearch } from "../utils/helper/webSearch";
import { scrapeResponse } from "../utils/helper/fireCrawl";
import { client } from "../config/tts";



const getChats = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    logger.info({ authHeader: !!authHeader }, "getChats: authorization header present")
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as JWTPayload;

    try {

        const chats = await prisma.chatMessages.findMany({
            where: {
                userId: decoded.userId
            },
            orderBy: { createdAt: 'asc' }
        })
        logger.info({ count: chats.length, userId: decoded.userId }, "getChats: fetched messages")

        res.status(200).json({
            success: true,
            data: chats,
            message: "Chats fetched successfully"
        })
        return;
    } catch (error) {
        logger.error({ err: error }, "getChats: error fetching chats")
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
        return;
    }

}

const getQueryCompletion = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token) as JWTPayload;

        const { query } = req.body;
        logger.info({ userId: decoded.userId, query }, "getQueryCompletion: received query")

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query is required",
            });
        }

        // SSE Headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        });

        // Handle client disconnect
        req.on("close", () => {
            logger.info({ userId: decoded.userId }, "getQueryCompletion: client disconnected")
            res.end();
        });

        logger.info({ userId: decoded.userId }, "getQueryCompletion: streaming started")
        const stream = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
You are a smart and helpful travel assistant named TripBot.

Your job is to **enhance user travel-related queries** by adding missing context, clarifying ambiguities, and expanding the query to make it more detailed and actionable for a travel planning system.

Your response should:
- Rewrite the user's query into a **more specific, enriched version**.
- **DO NOT** answer the query.
- Add **locations**, **travel seasons**, **budget hints**, or **related preferences** if the user omits them.
- Always respond in **one or two complete sentences**, fully rephrasing the query in a helpful and detailed way.

### Examples:
User: "I want to go to Paris"
You: "Plan a 5-day trip to Paris in the spring, focusing on local food, museums, and budget-friendly hotels near the city center."

User: "Suggest places for solo travel"
You: "Find destinations ideal for solo travelers in Southeast Asia during November, with safety tips and offbeat local experiences."
                    `,
                },
                {
                    role: "user",
                    content: `Enhance the following travel query into a more detailed version: "${query}"`,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            stream: true,
        });

        let hasContent = false;
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                hasContent = true;
                res.write(`data: ${JSON.stringify({
                    type: "query-completion",
                    content: content,
                })}\n\n`);
            }
        }

        if (!hasContent) {
            res.write(`data: ${JSON.stringify({
                type: "query-completion",
                content: "Sorry, I couldn't enhance the query. Please try again.",
            })}\n\n`);
        }

        res.end();
        logger.info({ userId: decoded.userId }, "getQueryCompletion: streaming ended")

    } catch (error) {
        logger.error({ err: error }, "getQueryCompletion: error")

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }

        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'An error occurred while processing your request',
        })}\n\n`);
        res.end();
    }
};


const getResponse = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
            return;
        }
        
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Query is required and must be a non-empty string"
            });
            return;
        }
        
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token) as JWTPayload;
        logger.info({ userId: decoded.userId, query }, "getResponse: received query");

        // Persist the user's message for history
        const savedUser = await prisma.chatMessages.create({
            data: {
                userId: decoded.userId,
                message: query,
                role: "user",
            }
        });
        logger.debug({ id: savedUser.id }, "getResponse: saved user message")

        const messages = [
            {
                role: "system",
                content: TOOL_SELECTION_PROMPT
            },
            {
                role: "user",
                content: query
            }
        ];
        
        logger.debug({ messages, prompt: TOOL_SELECTION_PROMPT }, "getResponse: sending tool selection request to GROQ");
        
        let toolResponse;
        try {
            toolResponse = await getGroqChatCompletion(messages);
        } catch (error) {
            logger.error({ error, query }, "getResponse: failed to get tool selection from GROQ");
            toolResponse = "**<TOOL:greetingTool>**";
            logger.info({ fallbackResponse: toolResponse }, "getResponse: using fallback tool response");
        }
        
        logger.info({ toolResponse, query }, "getResponse: tool selection response");
        
        // Clean up the response if it contains tool markers
        let cleanToolResponse = toolResponse;
        if (toolResponse && typeof toolResponse === 'string') {
            // Remove any extra whitespace or formatting
            cleanToolResponse = toolResponse.trim();
            logger.debug({ cleanToolResponse }, "getResponse: cleaned tool response");
        } else {
            logger.warn({ toolResponse, type: typeof toolResponse }, "getResponse: unexpected tool response type");
        }

        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        });

        let toolName: Tool;
        try {
            toolName = getAgents(cleanToolResponse as string);
            logger.info({ selectedTool: toolName.name }, "getResponse: selected tool");
        } catch (error) {
            logger.error({ toolResponse: cleanToolResponse, error }, "getResponse: failed to parse tool selection");
            // Fallback to greeting tool for simple queries
            toolName = { id: 1, name: "greetingTool", description: "Use for greetings", isParameter: false };
            logger.info({ fallbackTool: toolName.name }, "getResponse: using fallback tool");
        }
        let webSearchData: any[] = [];

        if (toolName.name === "greetingTool") {
            // Load recent history EXCLUDING the current user message to avoid circular reference
            const history = await prisma.chatMessages.findMany({
                where: { 
                    userId: decoded.userId,
                    id: { not: savedUser.id } // Exclude the current user message
                },
                orderBy: { createdAt: 'asc' },
                take: 20,
            });
            logger.debug({ count: history.length }, "getResponse:greetingTool: loaded history");
            const historyMessages = history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.message }));

            const greetMessages = [
                { role: "system", content: GREETING_PROMPT },
                ...historyMessages,
                { role: "user", content: query }, // Current user query at the end for immediate context
            ] as any[];

            logger.debug({ 
                messageCount: greetMessages.length, 
                firstMessage: greetMessages[0],
                lastMessage: greetMessages[greetMessages.length - 1],
                historyRoles: historyMessages.map(m => m.role),
                currentQuery: query,
                excludedMessageId: savedUser.id
            }, "getGreetingMessage: prepared messages for GROQ");
            
            try {
                const stream = await getGreetingMessage(greetMessages);
                logger.info({ userId: decoded.userId }, "getResponse:greetingTool: streaming started");
                
                let hasContent = false;
                let assistantContent = "";
                
                logger.debug("getResponse:greetingTool: starting to process stream chunks");
                let chunkCount = 0;
                
                for await (const chunk of stream) {
                    chunkCount++;
                    logger.debug({ chunkCount, chunk: JSON.stringify(chunk) }, "getResponse:greetingTool: received chunk");
                    
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        hasContent = true;
                        assistantContent += content;
                        logger.debug({ content, totalLength: assistantContent.length }, "getResponse:greetingTool: writing content chunk");
                        res.write(`data: ${JSON.stringify({
                            type: "query-completion",
                            content: content,
                        })}\n\n`);
                    } else {
                        logger.debug({ chunkCount }, "getResponse:greetingTool: chunk has no content");
                    }
                }
                
                logger.debug({ chunkCount, hasContent, finalContentLength: assistantContent.length }, "getResponse:greetingTool: finished processing stream");
        
                if (!hasContent) {
                    logger.warn({ userId: decoded.userId }, "getResponse:greetingTool: no content received from stream");
                    
                    // Try non-streaming as fallback
                    try {
                        logger.debug("getResponse:greetingTool: trying non-streaming fallback");
                        const fallbackResponse = await groq.chat.completions.create({
                            messages: greetMessages,
                            model: "llama-3.3-70b-versatile",
                            temperature: 0.2,
                            max_tokens: 1000,
                            stream: false
                        });
                        
                        const fallbackContent = fallbackResponse.choices[0]?.message?.content || "";
                        if (fallbackContent) {
                            logger.debug({ fallbackContent }, "getResponse:greetingTool: fallback response received");
                            res.write(`data: ${JSON.stringify({
                                type: "query-completion",
                                content: fallbackContent,
                            })}\n\n`);
                            assistantContent = fallbackContent;
                        } else {
                            // Use hardcoded fallback
                            const hardcodedResponse = "Hi! I'm Travo, your travel assistant. What kind of trip are you thinking about?";
                            res.write(`data: ${JSON.stringify({
                                type: "query-completion",
                                content: hardcodedResponse,
                            })}\n\n`);
                            assistantContent = hardcodedResponse;
                        }
                    } catch (fallbackError) {
                        logger.error({ fallbackError }, "getResponse:greetingTool: fallback completion failed");
                        // Use hardcoded fallback
                        const hardcodedResponse = "Hi! I'm Travo, your travel assistant. What kind of trip are you thinking about?";
                        res.write(`data: ${JSON.stringify({
                            type: "query-completion",
                            content: hardcodedResponse,
                        })}\n\n`);
                        assistantContent = hardcodedResponse;
                    }
                }
                
                // Save assistant response
                if (assistantContent) {
                    const savedAssistant = await prisma.chatMessages.create({
                        data: {
                            userId: decoded.userId,
                            message: assistantContent,
                            role: "assistant",
                        }
                    });
                    logger.debug({ id: savedAssistant.id }, "getResponse:greetingTool: saved assistant message");
                }
        
                res.end();
                logger.info({ userId: decoded.userId }, "getResponse:greetingTool: streaming ended");
                return;
            } catch (error) {
                logger.error({ error, userId: decoded.userId }, "getResponse:greetingTool: error in streaming");
                // Fallback response on error
                const fallbackResponse = "Hi! I'm Travo, your travel assistant. What kind of trip are you thinking about?";
                res.write(`data: ${JSON.stringify({
                    type: "query-completion",
                    content: fallbackResponse,
                })}\n\n`);
                
                // Save fallback response
                await prisma.chatMessages.create({
                    data: {
                        userId: decoded.userId,
                        message: fallbackResponse,
                        role: "assistant",
                    }
                });
                
                res.end();
                return;
            }
        }else if(toolName.name === "infoTool"){
            // Run a quick web search to ground the answer if possible
            const messaages = [
                {role: "system", content: UNDERSTAND_USER_QUERY_PROMPT},
                {role: "user", content: query}
            ]
            const userQuery = await underStandUserQuery(messaages)
            console.log("user query", userQuery)

            const newQuery = JSON.parse(userQuery as string)


            const results = await webSearch(newQuery.search_query, 5);
           const scrapeResponseData =  await scrapeResponse(newQuery.search_query)
            logger.info({ results: results.length }, "getResponse:infoTool: web search results")
            webSearchData = scrapeResponseData && scrapeResponseData.length ? scrapeResponseData.map((result, index) => {
                return {
                    id:index+1,
                    title: result.title,
                    snippet: result.description,
                    url: result.url,
                    favicon: result.metadata ? result.metadata.favicon : ""
                }
            } ) : [];
            const webContext = scrapeResponseData && scrapeResponseData.length
            ? `\n\nWeb Search Results:
          Instructions for using these results:
          - Write in a natural, conversational tone as if talking to a friend
          - Avoid numbered lists, bullet points, or rigid formatting unless specifically requested
          - Weave information from sources into flowing paragraphs
          - Use phrases like "I found that...", "According to...", "It seems like..." to make it personal
          - Cite sources naturally within sentences: "The food blog XYZ mentions that..." 
          - Share interesting details and context, not just bare facts
          - If multiple sources agree, say something like "Several sources highlight..."
          - Make recommendations feel personal: "You might really enjoy..." or "A great option would be..."
          
          Available sources:
          ${scrapeResponseData.map((r, i) => {
            const preview = r.markdown?.slice(0, 1000) ?? '';
            const truncated = r.markdown && r.markdown.length > 1000 ? '...' : '';
            return `${i + 1}. Title: "${r.title}"
             URL: ${r.url || 'N/A'}
             Content Preview: ${preview}${truncated}
             Published: ${r.metadata?.sourceURL || 'Date not available'}
             
          `;
          }).join('')}
          
          Remember: Your goal is to provide a helpful, accurate answer that serves the user's needs, not just to summarize the sources. Use these sources as supporting evidence for your response.`
            : '';
          
          

            console.log("websearch data in info tool", webContext)

            // Load recent history EXCLUDING the current user message to avoid circular reference
            const history = await prisma.chatMessages.findMany({
                where: { 
                    userId: decoded.userId,
                    id: { not: savedUser.id } // Exclude the current user message
                },
                orderBy: { createdAt: 'asc' },
                take: 20,
            });
            logger.debug({ 
                count: history.length,
                excludedMessageId: savedUser.id,
                currentQuery: query
            }, "getResponse:infoTool: loaded history")
            const historyMessages = history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.message }));
            // console.log("websearch results in info tool", webContext)
            logger.info({ webContext }, "getResponse:infoTool: web context using firecrawl")
            

            const infoMessages = [
                { role: "system", content: INFO_PROMPT + webContext},
                ...historyMessages,
                { role: "user", content: query }, // Current user query is already here
            ] as any[];

            const stream = await groq.chat.completions.create({
                messages: infoMessages as any,
                model: "moonshotai/kimi-k2-instruct",
                temperature: 0.3,
                stream: true,
            });
            logger.info({ userId: decoded.userId }, "getResponse:infoTool: streaming started")

            let hasContent = false;
            let assistantContent = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    hasContent = true;
                    assistantContent += content;
                    res.write(`data: ${JSON.stringify({
                        type: "info",
                        content,
                    })}\n\n`);
                }
            }

            if (!hasContent) {
                logger.warn({ userId: decoded.userId }, "getResponse:infoTool: stream empty, falling back to non-stream")
                try {
                    const fallback = await groq.chat.completions.create({
                        messages: infoMessages as any,
                        model: "llama-3.3-70b-versatile",
                        temperature: 0.3,
                        stream: false,
                    } as any);
                    const text = (fallback as any)?.choices?.[0]?.message?.content ?? "";
                    if (text) {
                        assistantContent = text;
                        res.write(`data: ${JSON.stringify({ type: "info", content: text })}\n\n`);
                        await prisma.chatMessages.create({
                            data: { userId: decoded.userId, message: text, role: "assistant" }
                        });
                    } else {
                        res.write(`data: ${JSON.stringify({
                            type: "info",
                            content: "Sorry, I couldn't find helpful travel info. Please try again.",
                        })}\n\n`);
                    }
                } catch (e) {
                    logger.error({ err: e }, "getResponse:infoTool: fallback completion failed")
                    res.write(`data: ${JSON.stringify({
                        type: "info",
                        content: "Sorry, I couldn't find helpful travel info. Please try again.",
                    })}\n\n`);
                }
            } else {
                // Save assistant response
                const savedAssistant = await prisma.chatMessages.create({
                    data: {
                        userId: decoded.userId,
                        message: assistantContent,
                        role: "assistant",
                        webSearchData: webSearchData.map(item => JSON.stringify(item)),
                    }
                });
                logger.debug({ id: savedAssistant.id }, "getResponse:infoTool: saved assistant message")
            }
        
            console.log("websearch data in trip planner tool", webSearchData)
            res.write(`data: ${JSON.stringify({
                type: "planner",
                webSearchData: webSearchData,
            })}\n\n`);
            res.end();
            logger.info({ userId: decoded.userId }, "getResponse:infoTool: streaming ended")
            return;
        } else if (toolName.name === "tripPlannerTool") {
            // Import prompt lazily to avoid circular imports if any
            const { TRIP_PLANNER_PROMPT } = await import("../prompts/persona");

            // Load recent history EXCLUDING the current user message to avoid circular reference
            const history = await prisma.chatMessages.findMany({
                where: { 
                    userId: decoded.userId,
                    id: { not: savedUser.id } // Exclude the current user message
                },
                orderBy: { createdAt: 'asc' },
                take: 20,
            });
            logger.debug({ 
                count: history.length,
                excludedMessageId: savedUser.id,
                currentQuery: query
            }, "getResponse:tripPlannerTool: loaded history")
            const historyMessages = history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.message }));

            const plannerMessages = [
                { role: "system", content: TRIP_PLANNER_PROMPT },
                ...historyMessages,
                { role: "user", content: query }, // Current user query is already here
            ] as any[];

            const stream = await groq.chat.completions.create({
                messages: plannerMessages as any,
                model: "moonshotai/kimi-k2-instruct",
                temperature: 0.35,
                stream: true,
            });
            logger.info({ userId: decoded.userId }, "getResponse:tripPlannerTool: streaming started")

            let hasContent = false;
            let assistantContent = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    hasContent = true;
                    assistantContent += content;
                    res.write(`data: ${JSON.stringify({
                        type: "planner",
                        content,
                    })}\n\n`);
                }
                
            }

           


            if (!hasContent) {
                logger.warn({ userId: decoded.userId }, "getResponse:tripPlannerTool: stream empty, falling back to non-stream")
                try {
                    const fallback = await groq.chat.completions.create({
                        messages: plannerMessages as any,
                        model: "moonshotai/kimi-k2-instruct",
                        temperature: 0.35,
                        stream: false,
                    } as any);
                    const text = (fallback as any)?.choices?.[0]?.message?.content ?? "";
                    if (text) {
                        assistantContent = text;
                        res.write(`data: ${JSON.stringify({ type: "planner", content: text })}\n\n`);
                        await prisma.chatMessages.create({
                            data: { userId: decoded.userId, message: text, role: "assistant" }
                        });
                    } else {
                        res.write(`data: ${JSON.stringify({
                            type: "planner",
                            content: "Sorry, I couldn't draft a plan. Please try again.",
                        })}\n\n`);
                    }
                } catch (e) {
                    logger.error({ err: e }, "getResponse:tripPlannerTool: fallback completion failed")
                    res.write(`data: ${JSON.stringify({
                        type: "planner",
                        content: "Sorry, I couldn't draft a plan. Please try again.",
                    })}\n\n`);
                }
            } else {
                const savedAssistant = await prisma.chatMessages.create({
                    data: {
                        userId: decoded.userId,
                        message: assistantContent,
                        webSearchData: webSearchData.map(item => JSON.stringify(item)),
                        role: "assistant",
                    }
                });
                logger.debug({ id: savedAssistant.id }, "getResponse:tripPlannerTool: saved assistant message")
            }
            // `${index + 1}. ${result.title} — ${result.snippet ?? ''} (${result.url}) ${result.favicon ? `<img src="${result.favicon}" alt="Favicon" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">` : ''}`
         
            console.log("websearch data in trip planner tool", webSearchData)
            res.write(`data: ${JSON.stringify({
                type: "info",
                webSearchData: webSearchData,
            })}\n\n`);

            res.end();
            logger.info({ userId: decoded.userId }, "getResponse:tripPlannerTool: streaming ended")
            return;
        }

        
        // Handle other tools here if needed
        // For now, send a default response for unrecognized tools
        res.write(`data: ${JSON.stringify({
            type: "tool-selection",
            content: cleanToolResponse,
        })}\n\n`);
        res.end();
        
    } catch (error) {
        logger.error({ err: error }, "getResponse: error")
        
        // Check if headers have been sent before trying to send error response
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        } else {
            // If headers were sent, send error via SSE
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: 'An error occurred while processing your request',
            })}\n\n`);
            res.end();
        }
        return;
    }
}


const deleteChat = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        logger.info({ authHeader: !!authHeader }, "deleteChat: authorization header present");
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token) as JWTPayload;

        const deleteChats = await prisma.chatMessages.deleteMany({
            where: {
                userId: decoded.userId
            }
        });
        logger.info({ count: deleteChats.count, userId: decoded.userId }, "deleteChat: deleted chats");
        if (deleteChats.count === 0) {
            return res.status(404).json({
                success: false,
                message: "No chats found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Chats deleted successfully"
        });

    } catch (error) {
        logger.error({ err: error }, "deleteChat: error");
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export { 
    getChats,
    getQueryCompletion,
    getResponse,
    deleteChat
 }