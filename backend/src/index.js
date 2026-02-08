import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000; // fallback port
const _dirname = path.resolve();

// --- MIDDLEWARE ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// --- SERVE FRONTEND IN PRODUCTION ---
// --- SERVE FRONTEND IN PRODUCTION ---
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(_dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  // Use RegExp /(.*)/ instead of "*" to avoid path-to-regexp errors
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// --- START SERVER AFTER DB CONNECT ---
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on PORT: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err.message);
  });
