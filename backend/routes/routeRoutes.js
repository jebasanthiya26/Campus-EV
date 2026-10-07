import express from "express";
import Route from "../models/Route.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL ROUTES
router.get(
  "/",
  protect,
  authorizeRoles(
    "student",
    "faculty",
    "driver",
    "management"
  ),
  async (req, res) => {
    try {
      const routes = await Route.find()
        .sort({ name: 1 });

      res.json(routes);
    } catch (error) {
      console.error(
        "Get routes error:",
        error.message
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// CREATE ROUTE
router.post(
  "/",
  protect,
  authorizeRoles("management"),
  async (req, res) => {
    try {
      const route =
        await Route.create(req.body);

      res.status(201).json(route);
    } catch (error) {
      console.error(
        "Create route error:",
        error.message
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

export default router;