import { Router } from "express";
import { deleteChat, getChats, getQueryCompletion, getResponse } from "../controllers/chatControllers";

const router = Router();

router.get("/get-chats", getChats)
router.post("/get-query-completion", getQueryCompletion)

router.post("/response", getResponse)
router.delete("/delete-chat", deleteChat)

export default router;