

// Import Express framework
import express from "express";

// Import deleteAccount controller separately
import { deleteAccount } from "../controllers/auth.controller.js";

// Import authentication-related controllers
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth
} from "../controllers/auth.controller.js";

// Middleware used to protect private routes (checks JWT authentication)
import { protectRoute } from "../middleware/auth.middleware.js";

// Create Express router instance
const router = express.Router();


// =============================
// AUTH ROUTES
// =============================

// User signup route
// Creates a new user account
router.post("/signup", signup);

// User login route
// Authenticates user and sets JWT cookie
router.post("/login", login);

// User logout route
// Clears JWT cookie and logs user out
router.post("/logout", logout);


// =============================
// PROTECTED USER ROUTES
// =============================

// Update user profile picture
// Requires authentication
router.put("/update-profile", protectRoute, updateProfile);

// Check if user is authenticated
// Returns current logged-in user data
router.get("/check", protectRoute, checkAuth);


// =============================
// ACCOUNT MANAGEMENT
// =============================

// DELETE ACCOUNT
// Permanently deletes user account and all related messages
// Route is protected to ensure only logged-in users can delete their account
router.delete("/delete-account", protectRoute, deleteAccount);


// Export router to be used in main server file
export default router;
