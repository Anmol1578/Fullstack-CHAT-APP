import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

export const app = express();
export const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", async (socket) => {
  try {
    const userId = socket.handshake.query.userId;

    if (!userId) return;

    userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // MARK DELIVERED WHEN USER CONNECTS
    const undeliveredMessages = await Message.find({
      receiverId: userId,
      status: "sent",
    });

    if (undeliveredMessages.length > 0) {
      await Message.updateMany(
        {
          receiverId: userId,
          status: "sent",
        },
        {
          $set: { status: "delivered" },
        },
      );

      // notify senders
      undeliveredMessages.forEach((msg) => {
        const senderSocket = getReceiverSocketId(msg.senderId.toString());

        if (senderSocket) {
          io.to(senderSocket).emit("messageDelivered", {
            messageId: msg._id,
          });
        }
      });
    }

    // TYPING INDICATOR FEATURE

    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId });
      }
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { senderId });
      }
    });

    // EDIT MESSAGE

    socket.on("editMessage", async ({ messageId, newText, receiverId }) => {
      try {
        if (!newText || !newText.trim()) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.senderId.toString() !== userId) return;
        if (message.isDeletedForEveryone) return;

        message.text = newText.trim();
        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();

        // update sender
        io.to(socket.id).emit("messageUpdated", message);

        // update receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageUpdated", message);
        }
      } catch (error) {
        console.error("Edit message error:", error);
      }
    });

    // DELETE FOR EVERYONE

    socket.on("deleteForEveryone", async ({ messageId, receiverId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        if (message.senderId.toString() !== userId) return;

        message.isDeletedForEveryone = true;
        message.text = "This message was deleted";
        message.image = "";

        await message.save();

        io.to(socket.id).emit("messageDeletedGlobally", messageId);

        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageDeletedGlobally", messageId);
        }
      } catch (error) {
        console.log("Delete for everyone error:", error);
      }
    });

    // DELETE FOR ME

    socket.on("deleteForMe", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedBy: userId },
        });

        io.to(socket.id).emit("messageHiddenLocally", messageId);
      } catch (error) {
        console.log("Delete for me error:", error);
      }
    });

    // MARK AS SEEN
    socket.on("markMessagesSeen", async ({ senderId }) => {
      try {
        if (!senderId) return;

        await Message.updateMany(
          {
            senderId,
            receiverId: userId,
            seen: false,
          },
          {
            $set: {
              seen: true,
              status: "seen",
            },
          },
        );

        const senderSocketId = getReceiverSocketId(senderId);

        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesSeen", {
            senderId: userId,
          });
        }
      } catch (error) {
        console.log("Seen update error:", error);
      }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      delete userSocketMap[userId];

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  } catch (error) {
    console.error("Socket connection error:", error);
  }
});
