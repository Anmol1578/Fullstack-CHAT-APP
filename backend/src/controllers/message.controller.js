import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

//  GET USERS FOR SIDEBAR

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

//  GET MESSAGES

export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const myId = req.user._id;

    // mark unseen messages as seen
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

    // notify sender about seen
    const senderSocketId = getReceiverSocketId(otherUserId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        senderId: myId,
      });
    }

    // fetch conversation
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

//  SEND MESSAGE

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo, replyPreview } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({
        error: "Message must contain text or image",
      });
    }

    let imageUrl;

    if (image) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "chat-app",
      });

      imageUrl = upload.secure_url;
    }

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

    const receiverSocketId = getReceiverSocketId(receiverId);

    // mark delivered if user online
    if (receiverSocketId) {
      newMessage.status = "delivered";
      await newMessage.save();

      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//  DELETE CONVERSATION
//  Telegram Style

export const deleteConversation = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const { deleteForBoth } = req.body;
    const myId = req.user._id;

    const mySocketId = getReceiverSocketId(myId);
    const receiverSocketId = getReceiverSocketId(otherUserId);

    /* DELETE FOR BOTH USERS */
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

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("conversationDeleted", payload);
      }

      if (mySocketId) {
        io.to(mySocketId).emit("conversationDeleted", payload);
      }

      return res.status(200).json({
        message: "Conversation deleted for both users",
      });
    }

    /* DELETE ONLY FOR ME */

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

    // 🔥 emit only to current user
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
