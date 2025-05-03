require("dotenv").config();

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/User");

console.log("Auth routes loaded"); // Debug: Confirm auth.js is loaded

// Public Signup (creates reception accounts)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "reception", // Default to reception
    });
    await user.save();
    const payload = {
      id: user._id,
      name: user.name,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ token, message: "Account created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reception-only Signup (creates waiter and kitchen accounts)
router.post("/signup/reception", auth, async (req, res) => {
  try {
    if (req.user.role !== "reception") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { name, email, password, confirmPassword, role } = req.body;
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (!["waiter", "kitchen"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();
    res.status(201).json({ message: `Account created for ${name} (${role})` });
  } catch (err) {
    console.error("Reception signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Signin
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const payload = {
      id: user._id,
      name: user.name,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get all users (reception-only)
router.get("/users", auth, async (req, res) => {
  console.log("GET /api/auth/users hit"); // Debug: Confirm route is hit
  try {
    if (req.user.role !== "reception") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const users = await User.find({}, "name email role");
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
