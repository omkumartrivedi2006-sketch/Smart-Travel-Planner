import { Response, NextFunction } from "express";
import { Chat } from "../models/Chat";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getAIChatResponse } from "../services/aiService";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

/**
 * Send a message to the AI Travel Assistant
 * POST /api/chat/message
 */
export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { message, session } = req.body;

    if (!message || String(message).trim().length === 0) {
      throw new BadRequestError("Message content cannot be empty");
    }

    // 1. Resolve session ID (use provided or generate new one)
    const sessionId = session && String(session).trim().length > 0
      ? String(session).trim()
      : new mongoose.Types.ObjectId().toString();

    // 2. Fetch or create chat log
    let chat = await Chat.findOne({ user: userId, session: sessionId });
    if (!chat) {
      chat = new Chat({
        user: userId,
        session: sessionId,
        messages: [],
      });
    }

    // 3. Load message history context (limit to last 15 messages for token optimization)
    const contextHistory = chat.messages
      .slice(-15)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // 4. Get response from AI Service Layer
    logger.info(`Sending message to AI Assistant. Session: ${sessionId}, User: ${userId}`);
    const replyText = await getAIChatResponse({
      message: String(message).trim(),
      history: contextHistory,
    });

    // 5. Save user message and model response to database logs
    chat.messages.push({
      role: "user",
      content: String(message).trim(),
      timestamp: new Date(),
    });

    chat.messages.push({
      role: "model",
      content: replyText,
      timestamp: new Date(),
    });

    await chat.save();

    res.status(200).json({
      status: "success",
      data: {
        reply: replyText,
        session: sessionId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get chat message history
 * GET /api/chat/history
 */
export async function getHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { session } = req.query;

    let chat;
    if (session) {
      chat = await Chat.findOne({ user: userId, session: String(session) });
    } else {
      // Find the user's most recently active chat session
      chat = await Chat.findOne({ user: userId }).sort("-updatedAt");
    }

    res.status(200).json({
      status: "success",
      data: {
        session: chat ? chat.session : null,
        messages: chat ? chat.messages : [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete chat history
 * DELETE /api/chat/history
 */
export async function clearHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { session } = req.query;

    if (session) {
      const deletedCount = await Chat.deleteOne({ user: userId, session: String(session) });
      if (deletedCount.deletedCount === 0) {
        throw new NotFoundError(`Chat session '${session}' not found`);
      }
      logger.info(`Cleared chat session history: ${session} for User: ${userId}`);
    } else {
      await Chat.deleteMany({ user: userId });
      logger.info(`Cleared all chat session histories for User: ${userId}`);
    }

    res.status(200).json({
      status: "success",
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
}
