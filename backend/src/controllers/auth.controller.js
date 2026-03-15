/**
 * =========================================================
 * AUTH CONTROLLER
 * =========================================================
 * Handles authentication and user account operations:
 * - User Signup
 * - User Login
 * - User Logout
 * - Update Profile Picture
 * - Authentication Check
 * - Delete Account
 *
 * Technologies used:
 * - JWT for authentication
 * - bcrypt for password hashing
 * - Cloudinary for profile image uploads
 * - MongoDB (Mongoose models)
 */

import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// =========================================================
// USER SIGNUP CONTROLLER
// =========================================================
// Creates a new user account and returns user information
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Password length validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists with same email
    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    // Generate salt and hash password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate JWT token and store in HTTP-only cookie
      generateToken(newUser._id, res);

      // Save user to database
      await newUser.save();

      // Send user data back to client (excluding password)
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      // If user creation fails
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// USER LOGIN CONTROLLER
// =========================================================
// Authenticates user credentials and returns user data
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // If user does not exist
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare provided password with hashed password in database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token and store it in cookies
    generateToken(user._id, res);

    // Send user data back to frontend
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// USER LOGOUT CONTROLLER
// =========================================================
// Clears JWT cookie to log the user out
export const logout = (req, res) => {
  try {
    // Clear JWT cookie
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// UPDATE USER PROFILE PICTURE
// =========================================================
// Uploads profile image to Cloudinary and updates database
export const updateProfile = async (req, res) => {
  try {
    // Get profile picture from request body
    const { profilePic } = req.body;

    // Get authenticated user ID from middleware
    const userId = req.user._id;

    // Validate profile picture input
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // Update user's profile picture URL in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }, // return updated user
    );

    // Send updated user data back
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =========================================================
// CHECK AUTHENTICATION
// =========================================================
// Returns authenticated user data if JWT is valid
export const checkAuth = (req, res) => {
  try {
    // req.user is set by authentication middleware
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// DELETE USER ACCOUNT
// =========================================================
// Permanently deletes user account and related messages
export const deleteAccount = async (req, res) => {
  try {
    // Get authenticated user ID
    const userId = req.user._id;

    // Delete all messages where user is sender or receiver
    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    // Delete user document from database
    await User.findByIdAndDelete(userId);

    // Clear authentication cookie
    res.clearCookie("jwt");

    // Send success response
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

