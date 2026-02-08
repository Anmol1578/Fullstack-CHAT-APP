import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages, // make sure this is exported from message.controller.js
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// Use getMessages for getting chat with a specific user
router.get("/:id", protectRoute, getMessages);

// Send a message
router.post("/send/:id", protectRoute, sendMessage);

export default router;
