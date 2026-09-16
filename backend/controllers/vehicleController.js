import Vehicle from "../models/Vehicle.js";

// GET ALL VEHICLES
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("driver", "name email");

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET VEHICLE BY ID
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("driver", "name email");

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// SELECT VEHICLE
export const selectVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    vehicle.status = "ON";

    await vehicle.save();

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE GPS
export const updateGPS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          locationName:
            req.body.locationName || "Campus",
        },
        status: "RUNNING",
      },
      {
        new: true,
      }
    );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE SEATS
export const updateSeats = async (req, res) => {
  try {
    const { occupiedSeats } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        occupiedSeats: Number(occupiedSeats),
      },
      {
        new: true,
      }
    );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json({
      vehicleId: vehicle._id,
      totalSeats: vehicle.totalSeats,
      occupiedSeats: vehicle.occupiedSeats,
      availableSeats:
        vehicle.totalSeats - vehicle.occupiedSeats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE VEHICLE STATUS
export const updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE ROUTE
export const updateRoute = async (req, res) => {
  try {
    const { route } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        currentRoute: route,
      },
      {
        new: true,
      }
    );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};