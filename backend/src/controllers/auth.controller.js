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
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);

      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        username: newUser.username,
      });
    } else {
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
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      username: user.username,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// USER LOGOUT CONTROLLER
// =========================================================
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// UPDATE USER PROFILE (NAME + USERNAME + PROFILE PIC)
// =========================================================
export const updateProfile = async (req, res) => {
  try {
    const { fullName, username, profilePic } = req.body;
    const userId = req.user._id;

    const updateData = {};

    // update full name
    if (fullName) {
      updateData.fullName = fullName;
    }

    // update username
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }

      updateData.username = username.toLowerCase();
    }

    // update profile picture
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =========================================================
// CHECK USERNAME AVAILABILITY
// =========================================================
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res.json({ available: false });
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUser) {
      return res.json({
        available: false,
        message: "Username already taken",
      });
    }

    res.json({
      available: true,
      message: "Username available",
    });
  } catch (error) {
    console.log("Error checking username:", error);
    res.status(500).json({ available: false });
  }
};

// =========================================================
// CHECK AUTHENTICATION
// =========================================================
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =========================================================
// DELETE USER ACCOUNT
// =========================================================
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    await User.findByIdAndDelete(userId);

    res.clearCookie("jwt");

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

