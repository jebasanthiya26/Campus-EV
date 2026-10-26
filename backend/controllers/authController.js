import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ALLOWED_ROLES = ["student", "faculty", "driver", "management"];
const generateToken = (userId, role) => jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const userId = String(req.body.userId || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "").toLowerCase();
    if (!name || !userId || !password || !role) return res.status(400).json({ message: "Name, user ID, password and role are required." });
    if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ message: "Select a valid account role." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (name.length > 80 || userId.length > 60) return res.status(400).json({ message: "Name or user ID is too long." });
    const existingUser = await User.findOne({ userId });
    if (existingUser) return res.status(409).json({ message: "This User ID is already registered. Please log in or choose another ID." });
    const user = await User.create({ name, userId, password, role });
    return res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, userId: user.userId, role: user.role } });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "").toLowerCase();
    if (!userId || !password || !ALLOWED_ROLES.includes(role)) return res.status(400).json({ message: "User ID, password and a valid role are required." });
    const user = role === "student"
      ? await User.findOne({ userId, role: { $in: ["student", "faculty"] } })
      : await User.findOne({ userId, role });
    if (!user) return res.status(401).json({ message: "Invalid User ID or account type." });
    const passwordCorrect = await user.comparePassword(password);
    if (!passwordCorrect) return res.status(401).json({ message: "Invalid password." });
    const token = generateToken(user._id, user.role);
    return res.status(200).json({ message: "Login successful", token, user: { id: user._id, name: user.name, userId: user.userId, role: user.role } });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};
