import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import Vehicle from "./models/Vehicle.js";
import User from "./models/User.js";

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());


// ======================================================
// SOCKET AUTHENTICATION
// ======================================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    next(new Error("Invalid or expired token"));
  }
});


// ======================================================
// BASIC API
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "Campus EV Backend API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/routes", routeRoutes);


// ======================================================
// SOCKET.IO
// ======================================================

io.on("connection", (socket) => {

  console.log(
    "Socket connected:",
    socket.id,
    "| User:",
    socket.user.userId,
    "| Role:",
    socket.user.role
  );


  // ====================================================
  // DRIVER GPS UPDATE
  // ====================================================

  socket.on("gpsUpdate", async (data) => {
    try {

      if (socket.user.role !== "driver") {
        return;
      }

      const {
        vehicleId,
        latitude,
        longitude,
        accuracy,
      } = data;

      if (!vehicleId) {
        return;
      }

      if (
        latitude === undefined ||
        longitude === undefined
      ) {
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      const gpsAccuracy =
        accuracy !== undefined
          ? Number(accuracy)
          : null;


      // Validate coordinates

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return;
      }

      if (
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return;
      }


      const vehicle =
        await Vehicle.findById(vehicleId);

      if (!vehicle) {
        console.log(
          "Vehicle not found:",
          vehicleId
        );

        return;
      }


      // Driver can update ONLY assigned vehicle

      if (
        !vehicle.driver ||
        String(vehicle.driver) !==
          String(socket.user._id)
      ) {

        console.log(
          "Unauthorized GPS update:",
          socket.user.userId,
          vehicle.vehicleNumber
        );

        return;
      }


      // Save GPS location

      vehicle.currentLocation = {
        latitude: lat,
        longitude: lng,
        accuracy: Number.isFinite(gpsAccuracy)
          ? gpsAccuracy
          : null,
        locationName: "Live GPS",
      };

      vehicle.lastLocationUpdate = new Date();


      // IMPORTANT:
      // GPS does NOT automatically start the vehicle.
      // Driver must explicitly press START VEHICLE.

      await vehicle.save();


      // Send live location to students/faculty/management

      io.emit("vehicleLocation", {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,

        latitude: lat,
        longitude: lng,

        accuracy:
          Number.isFinite(gpsAccuracy)
            ? gpsAccuracy
            : null,

        currentRoute:
          vehicle.currentRoute,

        status:
          vehicle.status,

        occupiedSeats:
          vehicle.occupiedSeats,

        totalSeats:
          vehicle.totalSeats,

        availableSeats:
          vehicle.totalSeats -
          vehicle.occupiedSeats,

        updatedAt:
          vehicle.lastLocationUpdate,
      });

    } catch (error) {

      console.error(
        "GPS socket error:",
        error.message
      );

    }
  });


  // ====================================================
  // DRIVER SEAT UPDATE
  // ====================================================

  socket.on("seatUpdate", async (data) => {

    try {

      if (socket.user.role !== "driver") {
        return;
      }

      const {
        vehicleId,
        occupiedSeats,
      } = data;

      if (!vehicleId) {
        return;
      }

      const vehicle =
        await Vehicle.findById(vehicleId);

      if (!vehicle) {
        return;
      }


      if (
        !vehicle.driver ||
        String(vehicle.driver) !==
          String(socket.user._id)
      ) {

        return;
      }


      const seats =
        Number(occupiedSeats);


      if (
        !Number.isInteger(seats) ||
        seats < 0 ||
        seats > vehicle.totalSeats
      ) {

        return;
      }


      vehicle.occupiedSeats = seats;

      await vehicle.save();


      io.emit("seatUpdated", {

        vehicleId:
          vehicle._id,

        vehicleNumber:
          vehicle.vehicleNumber,

        occupiedSeats:
          vehicle.occupiedSeats,

        totalSeats:
          vehicle.totalSeats,

        availableSeats:
          vehicle.totalSeats -
          vehicle.occupiedSeats,

      });

    } catch (error) {

      console.error(
        "Seat socket error:",
        error.message
      );

    }

  });


  // ====================================================
  // DRIVER START / STOP VEHICLE
  // ====================================================

  socket.on(
    "vehicleStatusUpdate",
    async (data) => {

      try {

        if (
          socket.user.role !== "driver"
        ) {
          return;
        }


        const {
          vehicleId,
          status,
        } = data;


        if (!vehicleId) {
          return;
        }


        if (
          !["ON", "OFF", "RUNNING"]
            .includes(status)
        ) {

          return;
        }


        const vehicle =
          await Vehicle.findById(vehicleId);

        if (!vehicle) {
          return;
        }


        if (
          !vehicle.driver ||
          String(vehicle.driver) !==
            String(socket.user._id)
        ) {

          return;
        }


        vehicle.status = status;
        if (status === "OFF") {
  vehicle.driver = null;
  vehicle.currentRoute = null;
}

        await vehicle.save();


        io.emit(
          "vehicleStatusUpdated",
          {
            vehicleId:
              vehicle._id,

            vehicleNumber:
              vehicle.vehicleNumber,

            status:
              vehicle.status,

            currentRoute:
              vehicle.currentRoute,

            occupiedSeats:
              vehicle.occupiedSeats,

            totalSeats:
              vehicle.totalSeats,

            availableSeats:
              vehicle.totalSeats -
              vehicle.occupiedSeats,

            latitude:
              vehicle.currentLocation
                ?.latitude ?? null,

            longitude:
              vehicle.currentLocation
                ?.longitude ?? null,

            updatedAt:
              new Date(),
          }
        );


        console.log(
          `Vehicle ${vehicle.vehicleNumber} status: ${status}`
        );

      } catch (error) {

        console.error(
          "Vehicle status error:",
          error.message
        );

      }

    }
  );


  // ====================================================
  // DISCONNECT
  // ====================================================

  socket.on("disconnect", () => {

    console.log(
      "Socket disconnected:",
      socket.id,
      "| User:",
      socket.user?.userId
    );

  });

});


// ======================================================
// SERVER
// ======================================================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);