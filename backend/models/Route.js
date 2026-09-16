import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    stops: [
      {
        name: {
          type: String,
          required: true,
        },

        order: {
          type: Number,
          required: true,
        },
      },
    ],
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