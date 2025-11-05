import express from "express";
import {
  addMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../controllers/messageController.js";



const router = express.Router();

// POST /api/messages
router.post("/add-message", addMessage);

// GET /api/messages
router.get("/get-messages", getMessages);

// PUT /api/messages/read
router.put("/read-message", markMessageAsRead);

// DELETE /api/messages/:id
router.delete("/delete-message/:messageId", deleteMessage);

export default router;