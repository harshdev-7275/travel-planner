import dotenv from "dotenv";
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const PORT = process.env.PORT;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;





export  {
    JWT_SECRET,
    PORT,
    JWT_EXPIRES_IN,
    GROQ_API_KEY,
    SERPAPI_KEY,
}