import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Authentication token required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user =
      await User.findById(
        decoded.userId
      ).select("-password");

    next();
  } catch (error) {
    res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
};

export const authorizeRoles =
  (...roles) => {
    return (req, res, next) => {
      if (
        !roles.includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      next();
    };
  };