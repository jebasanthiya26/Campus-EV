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

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// STUDENT / FACULTY / DRIVER / MANAGEMENT
// Can view vehicles
router.get(
  "/",
  protect,
  authorizeRoles(
    "student",
    "faculty",
    "driver",
    "management"
  ),
  getVehicles
);

// Any authenticated user can view one vehicle
router.get(
  "/:id",
  protect,
  authorizeRoles(
    "student",
    "faculty",
    "driver",
    "management"
  ),
  getVehicleById
);

// DRIVER selects a vehicle
router.put(
  "/:id/select",
  protect,
  authorizeRoles("driver"),
  selectVehicle
);

// DRIVER updates GPS
router.put(
  "/:id/gps",
  protect,
  authorizeRoles("driver"),
  updateGPS
);

// DRIVER updates seats
router.put(
  "/:id/seats",
  protect,
  authorizeRoles("driver"),
  updateSeats
);

// DRIVER / MANAGEMENT update status
router.put(
  "/:id/status",
  protect,
  authorizeRoles(
    "driver",
    "management"
  ),
  updateVehicleStatus
);

// DRIVER / MANAGEMENT update route
router.put(
  "/:id/route",
  protect,
  authorizeRoles(
    "driver",
    "management"
  ),
  updateRoute
);

export default router;