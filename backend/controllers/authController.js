import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      userId,
      password,
      role,
    } = req.body;

    const existingUser =
      await User.findOne({ userId });

    if (existingUser) {
      return res.status(400).json({
        message: "User ID already exists",
      });
    }

    const user = await User.create({
      name,
      userId,
      password,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { userId, password, role } = req.body;

    let user;

    // Student / Faculty login
    if (role === "student") {
      user = await User.findOne({
        userId,
        role: {
          $in: ["student", "faculty"],
        },
      });
    } else {
      // Driver / Management login
      user = await User.findOne({
        userId,
        role,
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid User ID or role",
      });
    }

    const passwordCorrect =
      await user.comparePassword(password);

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const token = generateToken(
      user._id,
      user.role
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      message: "Login failed",
    });
  }
};