
import { tools, type Tool } from "../../prompts/tools";

export const getAgents = (toolMarker: string): Tool => {
    if (!toolMarker || typeof toolMarker !== 'string') {
        throw new Error(`Invalid tool marker: ${toolMarker}`);
    }
    
    // Clean up the tool marker
    const cleanMarker = toolMarker.trim();
    
    // Try to find exact matches first
    const exactMatch = tools.find(t => cleanMarker.includes(t.name));
    if (exactMatch) {
        return exactMatch;
    }
    
    // Try to find partial matches (case insensitive)
    const partialMatch = tools.find(t => 
        cleanMarker.toLowerCase().includes(t.name.toLowerCase())
    );
    if (partialMatch) {
        return partialMatch;
    }
    
    // Log the actual response for debugging
    console.log("Debug - Tool marker received:", JSON.stringify(cleanMarker));
    console.log("Debug - Available tools:", tools.map(t => t.name));
    
    throw new Error(`Unknown tool: ${cleanMarker}`);
}