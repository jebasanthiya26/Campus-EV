import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";

import Vehicle from "./models/Vehicle.js";

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ],
  },
});

app.use(cors());

app.use(express.json());


// HOME
app.get("/", (req, res) => {
  res.json({
    message: "Campus EV Backend API is running",
  });
});


// ROUTES
app.use("/api/auth", authRoutes);

app.use("/api/vehicles", vehicleRoutes);

app.use("/api/routes", routeRoutes);


// SOCKET.IO
io.on("connection", (socket) => {

  console.log(
    "User connected:",
    socket.id
  );


  // DRIVER GPS UPDATE
  socket.on("gpsUpdate", async (data) => {

    try {

      const {
        vehicleId,
        latitude,
        longitude,
      } = data;

      if (!vehicleId) return;

      const vehicle =
        await Vehicle.findByIdAndUpdate(
          vehicleId,
          {
            currentLocation: {
              latitude: Number(latitude),
              longitude: Number(longitude),
              locationName:
                data.locationName || "Campus",
            },
            status: "RUNNING",
          },
          {
            new: true,
          }
        );

      if (!vehicle) return;


      // SEND TO ALL STUDENTS
      io.emit("vehicleLocation", {
        vehicleId: vehicle._id,
        vehicleNumber:
          vehicle.vehicleNumber,

        latitude:
          vehicle.currentLocation.latitude,

        longitude:
          vehicle.currentLocation.longitude,

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
          new Date(),
      });

    } catch (error) {

      console.error(
        "GPS socket error:",
        error.message
      );

    }

  });


  // SEAT UPDATE
  socket.on("seatUpdate", async (data) => {

    try {

      const vehicle =
        await Vehicle.findByIdAndUpdate(
          data.vehicleId,
          {
            occupiedSeats:
              Number(data.occupiedSeats),
          },
          {
            new: true,
          }
        );

      if (!vehicle) return;


      io.emit("seatUpdated", {
        vehicleId: vehicle._id,

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


  socket.on("disconnect", () => {

    console.log(
      "User disconnected:",
      socket.id
    );

  });

});


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