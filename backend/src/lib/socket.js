import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("markMessagesSeen", async ({ senderId }) => {
    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: userId,
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );

    const senderSocketId = getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        senderId: userId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
