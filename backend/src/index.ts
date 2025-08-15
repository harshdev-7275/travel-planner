import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./config/logger";
import authRoutes from "./routes/authRoutes"
import chatRoutes from "./routes/chatRoutes"

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
    }
));
app.use(express.json());


app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming Request');
    logger.debug({ body: req.body }, 'Request Body');
    next();
});

app.get('/api/test', (req, res) => {
    logger.debug('Test endpoint hit');
    res.send({ message: 'API working!' });
});

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/chat", chatRoutes)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

