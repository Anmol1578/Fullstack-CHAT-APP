import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  deleteConversation,
} from "../controllers/message.controller.js";

const router = express.Router();

//  GET USERS FOR SIDEBAR

router.get("/users", protectRoute, getUsersForSidebar);

//   GET MESSAGES WITH A SPECIFIC USER
//  /api/messages/:id

router.get("/:id", protectRoute, getMessages);

//  SEND MESSAGE
//  /api/messages/send/:id

router.post("/send/:id", protectRoute, sendMessage);

//  DELETE CONVERSATION WITH A USER
//  /api/messages/conversation/:id

router.delete("/conversation/:id", protectRoute, deleteConversation);

export default router;
