export type Tool = {
    id: number,
    name: string,
    description: string,
    isParameter: boolean,
    parameters?: {
        type: string,
        description: string,
        required: boolean,
    }[]
}

export const tools:Tool[] = [
    {
        id: 1,
        name: "greetingTool",
        description: "Use for greetings (hi, hello, hey, good morning, etc.)",
        isParameter: false,
    },
    {
        id: 2,
        name: "infoTool",
        description: "Use for travel information, destination details, logistics, cultural info, etc.",
        isParameter: false,
    },
    {
        id: 3,
        name: "tripPlannerTool",
        description: "Use when user provides specific travel parameters (dates, destination, budget, preferences) and requests planning",
        isParameter: false,
    }
]

