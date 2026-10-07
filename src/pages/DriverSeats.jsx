import { useEffect, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function DriverSeats() {
  const [occupiedSeats, setOccupiedSeats] =
    useState(0);

  const [totalSeats, setTotalSeats] =
    useState(13);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const vehicleId =
    localStorage.getItem(
      "selectedVehicleId"
    );

  // Connect Socket.IO
  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    socket.auth = {
      token,
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load current seat count
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        setError(
          "No vehicle selected. Please select a vehicle first."
        );
        setLoading(false);
        return;
      }

      try {
        const token =
          localStorage.getItem("token");

        const response =
          await axios.get(
            `${API_URL}/api/vehicles/${vehicleId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setOccupiedSeats(
          response.data.occupiedSeats || 0
        );

        setTotalSeats(
          response.data.totalSeats || 13
        );

      } catch (err) {
        console.error(
          "Failed to load vehicle:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load vehicle data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const updateSeats = (
    newOccupiedSeats
  ) => {
    if (
      newOccupiedSeats < 0 ||
      newOccupiedSeats > totalSeats
    ) {
      return;
    }

    setOccupiedSeats(
      newOccupiedSeats
    );

    socket.emit(
      "seatUpdate",
      {
        vehicleId,
        occupiedSeats:
          newOccupiedSeats,
      }
    );
  };

  const increase = () => {
    if (
      occupiedSeats < totalSeats
    ) {
      updateSeats(
        occupiedSeats + 1
      );
    }
  };

  const decrease = () => {
    if (occupiedSeats > 0) {
      updateSeats(
        occupiedSeats - 1
      );
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <h1 className="page-heading">
          Seat Management
        </h1>

        <div className="page-card">
          Loading vehicle data...
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <h1 className="page-heading">
        Seat Management
      </h1>

      {error && (
        <div className="page-card">
          <p className="login-error">
            ⚠️ {error}
          </p>
        </div>
      )}

      <div className="page-card">

        <div className="seat-summary">
          Occupied Seats:{" "}
          {occupiedSeats} / {totalSeats}
        </div>

        <div className="seat-summary">
          Available Seats:{" "}
          {totalSeats -
            occupiedSeats} /{" "}
          {totalSeats}
        </div>

        <button
          className="select-vehicle-btn"
          onClick={increase}
          disabled={
            occupiedSeats >= totalSeats
          }
        >
          Add Passenger
        </button>

        <button
          className="change-vehicle-btn"
          onClick={decrease}
          disabled={
            occupiedSeats <= 0
          }
        >
          Remove Passenger
        </button>

      </div>
    </DriverLayout>
  );
}

export default DriverSeats;