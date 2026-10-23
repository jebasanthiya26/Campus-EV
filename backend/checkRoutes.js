import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Route from "./models/Route.js";

dotenv.config();

try {
  await connectDB();

  const routes = await Route.find(
    { name: { $in: ["Blue Line", "Green Line"] } },
    { name: 1, stops: 1 }
  ).lean();

  console.log(JSON.stringify(routes, null, 2));
} catch (error) {
  console.error("Route check failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
