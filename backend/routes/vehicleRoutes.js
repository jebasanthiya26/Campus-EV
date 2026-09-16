import express from "express";

import {
  getVehicles,
  getVehicleById,
  selectVehicle,
  updateGPS,
  updateSeats,
  updateVehicleStatus,
  updateRoute,
} from "../controllers/vehicleController.js";

const router = express.Router();

router.get(
  "/",
  getVehicles
);

router.get(
  "/:id",
  getVehicleById
);

router.put(
  "/:id/select",
  selectVehicle
);

router.put(
  "/:id/gps",
  updateGPS
);

router.put(
  "/:id/seats",
  updateSeats
);

router.put(
  "/:id/status",
  updateVehicleStatus
);

router.put(
  "/:id/route",
  updateRoute
);

export default router;