import Vehicle from "../models/Vehicle.js";

// Check whether the logged-in driver owns the vehicle
const checkDriverOwnership = (
  vehicle,
  user
) => {
  if (user.role !== "driver") {
    return true;
  }

  if (!vehicle.driver) {
    return false;
  }

  return (
    String(vehicle.driver) ===
    String(user._id)
  );
};


// GET ALL VEHICLES
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate(
        "driver",
        "name userId role"
      );

    res.json(vehicles);

  } catch (error) {
    console.error(
      "Get vehicles error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// GET VEHICLE BY ID
export const getVehicleById = async (
  req,
  res
) => {
  try {
    const vehicle =
      await Vehicle.findById(
        req.params.id
      ).populate(
        "driver",
        "name userId role"
      );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(vehicle);

  } catch (error) {
    console.error(
      "Get vehicle error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// SELECT VEHICLE
export const selectVehicle = async (
  req,
  res
) => {
  try {
    const vehicle =
      await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const isAlreadyAssigned =
      vehicle.driver &&
      String(vehicle.driver) !==
        String(req.user._id);

    const isActive =
      vehicle.status === "ON" ||
      vehicle.status === "RUNNING";

    // Another driver is using this vehicle.
    if (isAlreadyAssigned && isActive) {
      return res.status(409).json({
        message:
          "This vehicle is already assigned to another driver",
      });
    }

    // Vehicle is free OR already belongs to this driver.
    vehicle.driver = req.user._id;

    // Do not change RUNNING back to ON
    // when the same driver reconnects.
    if (vehicle.status === "OFF") {
      vehicle.status = "ON";
    }

    await vehicle.save();

    const updatedVehicle =
      await Vehicle.findById(
        vehicle._id
      ).populate(
        "driver",
        "name userId role"
      );

    res.json(updatedVehicle);

  } catch (error) {
    console.error(
      "Vehicle selection error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE GPS
export const updateGPS = async (
  req,
  res
) => {
  try {
    const {
      latitude,
      longitude,
      locationName,
    } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Latitude and longitude are required",
      });
    }

    const vehicle =
      await Vehicle.findById(
        req.params.id
      );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Driver can update only
    // their assigned vehicle.
    if (
      !checkDriverOwnership(
        vehicle,
        req.user
      )
    ) {
      return res.status(403).json({
        message:
          "You can only update your assigned vehicle",
      });
    }

    vehicle.currentLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationName:
        locationName || "Campus",
    };

    vehicle.status = "RUNNING";

    await vehicle.save();

    res.json(vehicle);

  } catch (error) {
    console.error(
      "GPS update error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE SEATS
export const updateSeats = async (
  req,
  res
) => {
  try {
    const {
      occupiedSeats,
    } = req.body;

    if (
      occupiedSeats === undefined
    ) {
      return res.status(400).json({
        message:
          "Occupied seats are required",
      });
    }

    const vehicle =
      await Vehicle.findById(
        req.params.id
      );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Driver can update only
    // their assigned vehicle.
    if (
      !checkDriverOwnership(
        vehicle,
        req.user
      )
    ) {
      return res.status(403).json({
        message:
          "You can only update your assigned vehicle",
      });
    }

    const seats =
      Number(occupiedSeats);

    if (
      !Number.isInteger(seats) ||
      seats < 0 ||
      seats > vehicle.totalSeats
    ) {
      return res.status(400).json({
        message:
          `Occupied seats must be between 0 and ${vehicle.totalSeats}`,
      });
    }

    vehicle.occupiedSeats = seats;

    await vehicle.save();

    res.json({
      vehicleId: vehicle._id,
      vehicleNumber:
        vehicle.vehicleNumber,
      totalSeats:
        vehicle.totalSeats,
      occupiedSeats:
        vehicle.occupiedSeats,
      availableSeats:
        vehicle.totalSeats -
        vehicle.occupiedSeats,
    });

  } catch (error) {
    console.error(
      "Seat update error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE VEHICLE STATUS
export const updateVehicleStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "ON",
      "OFF",
      "RUNNING",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid vehicle status",
      });
    }

    const vehicle =
      await Vehicle.findById(
        req.params.id
      );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Drivers can only change
    // their own vehicle status.
    if (
      !checkDriverOwnership(
        vehicle,
        req.user
      )
    ) {
      return res.status(403).json({
        message:
          "You can only update your assigned vehicle",
      });
    }

    vehicle.status = status;

    // STOP VEHICLE releases the EV.
    if (status === "OFF") {
      vehicle.driver = null;
      vehicle.currentRoute = null;
    }

    await vehicle.save();

    const updatedVehicle =
      await Vehicle.findById(
        vehicle._id
      ).populate(
        "driver",
        "name userId role"
      );

    res.json(updatedVehicle);

  } catch (error) {
    console.error(
      "Status update error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE ROUTE
export const updateRoute = async (
  req,
  res
) => {
  try {
    const { route } = req.body;

    if (!route) {
      return res.status(400).json({
        message:
          "Route is required",
      });
    }

    const vehicle =
      await Vehicle.findById(
        req.params.id
      );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    // Drivers can only change
    // their own vehicle route.
    if (
      !checkDriverOwnership(
        vehicle,
        req.user
      )
    ) {
      return res.status(403).json({
        message:
          "You can only update your assigned vehicle",
      });
    }

    vehicle.currentRoute = route;

    await vehicle.save();

    res.json(vehicle);

  } catch (error) {
    console.error(
      "Route update error:",
      error.message
    );

    res.status(500).json({
      message: error.message,
    });
  }
};