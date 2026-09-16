import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["ON", "OFF", "RUNNING"],
      default: "OFF",
    },

    totalSeats: {
      type: Number,
      default: 13,
    },

    occupiedSeats: {
      type: Number,
      default: 0,
    },

    currentLocation: {
      latitude: {
        type: Number,
        default: 0,
      },

      longitude: {
        type: Number,
        default: 0,
      },

      locationName: {
        type: String,
        default: "Campus",
      },
    },

    currentRoute: {
      type: String,
      default: "Blue Line",
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model(
  "Vehicle",
  vehicleSchema
);

export default Vehicle;