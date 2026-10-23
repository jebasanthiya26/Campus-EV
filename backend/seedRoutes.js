import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import Route from "./models/Route.js";

dotenv.config();

// GREEN LINE — Updated coordinates
const greenStops = [
  {
    sequence: 1,
    name: "HOSTEL MESS",
    latitude: 13.01377373715426,
    longitude: 80.23683422845927,
  },
  {
    sequence: 2,
    name: "DEPT OF MBA",
    latitude: 13.01232654680739,
    longitude: 80.23668830075685,
  },
  {
    sequence: 3,
    name: "NEAR SBI ATM",
    latitude: 13.010975828172477,
    longitude: 80.23647983260676,
  },
  {
    sequence: 4,
    name: "DEAN OFFICE",
    latitude: 13.010673692741596,
    longitude: 80.23540622166738,
  },
  {
    sequence: 5,
    name: "HIGH VOLTAGE",
    latitude: 13.010876809039383,
    longitude: 80.23444466231378,
  },
  {
    sequence: 6,
    name: "SOIL MECHANICS",
    latitude: 13.010937743895909,
    longitude: 80.23378017011882,
  },
  {
    sequence: 7,
    name: "DEPT OF MECHANICAL",
    latitude: 13.011059176397348,
    longitude: 80.23271803520792,
  },
];

// BLUE LINE — Updated coordinates
const blueStops = [
  {
    sequence: 1,
    name: "MAIN GATE",
    latitude: 13.008252624632366,
    longitude: 80.23518956866506,
  },
  {
    sequence: 2,
    name: "C.E.G-DEAN OFFICE",
    latitude: 13.010673692741596,
    longitude: 80.23540622166738,
  },
  {
    sequence: 3,
    name: "HIGH VOLTAGE",
    latitude: 13.010876809039383,
    longitude: 80.23444466231378,
  },
  {
    sequence: 4,
    name: "NCC OFFICE",
    latitude: 13.012177841361531,
    longitude: 80.23474319598293,
  },
  {
    sequence: 5,
    name: "DEPT OF PRINTING TECH",
    latitude: 13.013269249762159,
    longitude: 80.23495907012324,
  },
  {
    sequence: 6,
    name: "INTERNATIONAL HOSTEL",
    latitude: 13.014285493063532,
    longitude: 80.235868135226,
  },
  {
    sequence: 7,
    name: "CEG PG/UG GIRLS MESS",
    latitude: 13.01377373715426,
    longitude: 80.23683422845927,
  },
  {
    sequence: 8,
    name: "GIRLS HOSTEL",
    latitude: 13.012691201259441,
    longitude: 80.23672616512529,
  },
  {
    sequence: 9,
    name: "KOTTURPURAM GATE",
    latitude: 13.012293403657592,
    longitude: 80.23932577241501,
  },
];

const seedRoutes = async () => {
  try {
    await connectDB();

    // Update existing routes without deleting unrelated route data.
    await Route.findOneAndUpdate(
      { name: "Green Line" },
      {
        name: "Green Line",
        color: "green",
        stops: greenStops,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await Route.findOneAndUpdate(
      { name: "Blue Line" },
      {
        name: "Blue Line",
        color: "blue",
        stops: blueStops,
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log("Green Line updated: 7 stops.");
    console.log("Blue Line updated: 9 stops.");
    console.log("CampusEV routes seeded successfully.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Route seed error:", error);

    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

seedRoutes();
