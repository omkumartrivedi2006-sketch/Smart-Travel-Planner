import { Router } from "express";
import { sendMessage, getHistory, clearHistory } from "../controllers/chatController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Protect all chat endpoints
router.use(protect);

router.post("/message", sendMessage);
router.get("/history", getHistory);
router.delete("/history", clearHistory);

export default router;
