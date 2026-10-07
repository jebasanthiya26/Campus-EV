import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import Route from "./models/Route.js";

dotenv.config();

const greenStops = [
  {
    sequence: 1,
    name: "HOSTEL MESS",
    latitude: 13.013980,
    longitude: 80.237033,
  },
  {
    sequence: 2,
    name: "DEPT OF MBA",
    latitude: 13.012457,
    longitude: 80.236444,
  },
  {
    sequence: 3,
    name: "NEAR SBI ATM",
    latitude: 13.011004,
    longitude: 80.236443,
  },
  {
    sequence: 4,
    name: "DEAN OFFICE",
    latitude: 13.010970,
    longitude: 80.235441,
  },
  {
    sequence: 5,
    name: "HIGH VOLTAGE",
    latitude: 13.010994,
    longitude: 80.234402,
  },
  {
    sequence: 6,
    name: "SOIL MECHANICS",
    latitude: 13.010893,
    longitude: 80.233866,
  },
  {
    sequence: 7,
    name: "DEPT OF MECHANICAL",
    latitude: 13.011228,
    longitude: 80.232696,
  },
];

const blueStops = [
  {
    sequence: 1,
    name: "MAIN GATE",
    latitude: 13.008292,
    longitude: 80.235190,
  },
  {
    sequence: 2,
    name: "C.E.G-DEAN OFFICE",
    latitude: 13.010974,
    longitude: 80.235442,
  },
  {
    sequence: 3,
    name: "HIGH VOLTAGE",
    latitude: 13.010994,
    longitude: 80.234402,
  },
  {
    sequence: 4,
    name: "NCC OFFICE",
    latitude: 13.012813,
    longitude: 80.234519,
  },
  {
    sequence: 5,
    name: "DEPT OF PRINTING TECH",
    latitude: 13.013313,
    longitude: 80.235204,
  },
  {
    sequence: 6,
    name: "INTERNATIONAL HOSTEL",
    latitude: 13.014318,
    longitude: 80.235732,
  },
  {
    sequence: 7,
    name: "CEG PG/UG GIRLS MESS",
    latitude: 13.013781,
    longitude: 80.236868,
  },
  {
    sequence: 8,
    name: "GIRLS HOSTEL",
    latitude: 13.012814,
    longitude: 80.236718,
  },
  {
    sequence: 9,
    name: "KOTTURPURAM GATE",
    latitude: 13.012104,
    longitude: 80.240267,
  },
];

const seedRoutes = async () => {
  try {
    await connectDB();

    await Route.deleteMany({});

    await Route.create([
      {
        name: "Green Line",
        color: "green",
        stops: greenStops,
      },
      {
        name: "Blue Line",
        color: "blue",
        stops: blueStops,
      },
    ]);

    console.log(
      "Green Line and Blue Line created successfully."
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Route seed error:",
      error
    );

    process.exit(1);
  }
};

seedRoutes();