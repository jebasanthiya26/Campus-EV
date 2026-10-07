import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    color: {
      type: String,
      enum: ["green", "blue"],
      required: true,
    },

    stops: {
      type: [stopSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Route = mongoose.model(
  "Route",
  routeSchema
);

export default Route;