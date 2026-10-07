import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

      accuracy: {
        type: Number,
        default: null,
      },

      locationName: {
        type: String,
        default: "Campus",
      },
    },

    currentRoute: {
      type: String,
      enum: ["Green Line", "Blue Line"],
      default: null,
    },

    lastLocationUpdate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;