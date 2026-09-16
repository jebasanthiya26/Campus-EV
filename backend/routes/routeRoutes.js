import express from "express";
import Route from "../models/Route.js";

const router = express.Router();

router.get(
  "/",
  async (req, res) => {
    try {
      const routes =
        await Route.find();

      res.json(routes);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.post(
  "/",
  async (req, res) => {
    try {
      const route =
        await Route.create(
          req.body
        );

      res.status(201).json(
        route
      );
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

export default router;