/**
 * =========================================================
 * MESSAGE CONTROLLER
 * =========================================================
 * Handles all chat-related operations:
 * - Fetch sidebar users
 * - Get conversation messages
 * - Send messages (text or image)
 * - Clear all chats
 * - Delete conversation (for one user or both)
 *
 * Technologies used:
 * - MongoDB (Mongoose models)
 * - Cloudinary (image uploads)
 * - Socket.IO (real-time messaging)
 */

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


// =========================================================
// GET USERS FOR SIDEBAR
// =========================================================
// Returns all users except the currently logged-in user
// Used to populate the chat sidebar
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("getUsersForSidebar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// =========================================================
// GET MESSAGES BETWEEN TWO USERS
// =========================================================
// Fetches conversation messages between logged-in user
// and another user. Also updates message status to "seen".
export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // Mark unseen messages as seen
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: myId,
        seen: false,
      },
      {
        $set: { seen: true, status: "seen" },
      },
    );

    // Notify sender that messages were seen
    const senderSocketId = getReceiverSocketId(otherUserId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        senderId: myId,
      });
    }

    // Fetch conversation messages (excluding messages deleted by current user)
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId },
          ],
        },
        {
          deletedBy: { $ne: myId },
        },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// =========================================================
// SEND MESSAGE
// =========================================================
// Sends a new message between users
// Supports both text messages and image messages
export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo, replyPreview } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Ensure message contains text or image
    if (!text && !image) {
      return res.status(400).json({
        error: "Message must contain text or image",
      });
    }

    let imageUrl;

    // Upload image to Cloudinary if provided
    if (image) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "chat-app",
      });

      imageUrl = upload.secure_url;
    }

    // Create new message document
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: "sent",
      replyTo: replyTo || null,
      replyPreview: replyPreview || null,
    });

    await newMessage.save();

    // Get receiver's socket ID if they are online
    const receiverSocketId = getReceiverSocketId(receiverId);

    // Mark message as delivered if receiver is online
    if (receiverSocketId) {
      newMessage.status = "delivered";
      await newMessage.save();

      // Emit new message event to receiver
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// =========================================================
// CLEAR ALL CHATS
// =========================================================
// Deletes all messages where the logged-in user
// is either sender or receiver
export const clearAllChats = async (req, res) => {
  try {
    const userId = req.user._id;

    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    res.status(200).json({ message: "Chats cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// =========================================================
// DELETE CONVERSATION
// =========================================================
// Supports two deletion modes:
// 1. Delete conversation for both users
// 2. Delete conversation only for current user
export const deleteConversation = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const { deleteForBoth } = req.body;
    const myId = req.user._id;

    const mySocketId = getReceiverSocketId(myId);
    const receiverSocketId = getReceiverSocketId(otherUserId);

    /* =====================================================
       DELETE CONVERSATION FOR BOTH USERS
    ===================================================== */
    if (deleteForBoth) {
      await Message.deleteMany({
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      });

      const mySocketId = getReceiverSocketId(myId);
      const receiverSocketId = getReceiverSocketId(otherUserId);

      const payload = {
        senderId: myId,
        receiverId: otherUserId,
      };

      // Notify receiver about deletion
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("conversationDeleted", payload);
      }

      // Notify current user
      if (mySocketId) {
        io.to(mySocketId).emit("conversationDeleted", payload);
      }

      return res.status(200).json({
        message: "Conversation deleted for both users",
      });
    }

    /* =====================================================
       DELETE CONVERSATION ONLY FOR CURRENT USER
    ===================================================== */

    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      },
      {
        $addToSet: { deletedBy: myId },
      },
    );

    // Emit deletion event only to current user
    if (mySocketId) {
      io.to(mySocketId).emit("conversationDeleted", {
        userId: otherUserId,
      });
    }

    res.status(200).json({
      message: "Conversation cleared for you",
    });
  } catch (error) {
    console.error("deleteConversation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
