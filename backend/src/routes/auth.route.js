// Import Express framework
import express from "express";

// Import authentication-related controllers
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
  deleteAccount,
  checkUsername,
} from "../controllers/auth.controller.js";

// Middleware used to protect private routes (checks JWT authentication)
import { protectRoute } from "../middleware/auth.middleware.js";

// Create Express router instance
const router = express.Router();

// =============================
// AUTH ROUTES
// =============================

// User signup route
router.post("/signup", signup);

// User login route
router.post("/login", login);

// User logout route
router.post("/logout", logout);

// =============================
// USERNAME CHECK
// =============================

// Check Username Availability
router.get("/check-username/:username", checkUsername);

// =============================
// PROTECTED USER ROUTES
// =============================

// Update user profile (name + username + profile picture)
router.put("/update-profile", protectRoute, updateProfile);

// Check if user is authenticated
router.get("/check", protectRoute, checkAuth);

// =============================
// ACCOUNT MANAGEMENT
// =============================

// Delete account
router.delete("/delete-account", protectRoute, deleteAccount);

// Export router
export default router;
