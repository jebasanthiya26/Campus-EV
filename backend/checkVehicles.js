import dotenv from "dotenv";
import mongoose from "mongoose";
import Vehicle from "./models/Vehicle.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected\n");

  const vehicles = await Vehicle.find(
    {},
    {
      vehicleNumber: 1,
      status: 1,
      currentRoute: 1,
      currentLocation: 1,
    }
  ).lean();

  console.log(JSON.stringify(vehicles, null, 2));

  await mongoose.disconnect();
} catch (error) {
  console.error("ERROR:", error.message);
}