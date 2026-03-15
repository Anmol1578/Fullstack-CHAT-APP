// Import Express framework
import express from "express";

// Middleware to protect routes (ensures user is authenticated via JWT)
import { protectRoute } from "../middleware/auth.middleware.js";

// Import message-related controller functions
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  deleteConversation,
  clearAllChats,
} from "../controllers/message.controller.js";

// Create Express router instance
const router = express.Router();


// =============================
// SIDEBAR USERS
// =============================

// GET USERS FOR SIDEBAR
// Returns all users except the logged-in user
// Used to populate the chat sidebar list
router.get("/users", protectRoute, getUsersForSidebar);


// =============================
// MESSAGES
// =============================

// GET MESSAGES WITH A SPECIFIC USER
// Example route: /api/messages/:id
// Returns conversation messages between logged-in user and selected user
router.get("/:id", protectRoute, getMessages);


// SEND MESSAGE
// Example route: /api/messages/send/:id
// Sends a message from the logged-in user to the selected user
router.post("/send/:id", protectRoute, sendMessage);


// =============================
// CONVERSATION MANAGEMENT
// =============================

// DELETE CONVERSATION WITH A USER
// Example route: /api/messages/conversation/:id
// Deletes all messages between logged-in user and selected user
router.delete("/conversation/:id", protectRoute, deleteConversation);


// CLEAR ALL CHATS
// Deletes all conversations of the logged-in user
router.delete("/clear", protectRoute, clearAllChats);


// Export router so it can be used in the main server file
export default router;
