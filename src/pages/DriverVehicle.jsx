
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverVehicle() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const vehicleId =
    localStorage.getItem("selectedVehicleId");

  const vehicleNumber =
    localStorage.getItem("selectedVehicleNumber") ||
    "Campus EV";
    useEffect(() => {
  const loadVehicleStatus = async () => {
    if (!vehicleId) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/vehicles/${vehicleId}`
      );

      setRunning(response.data.status === "RUNNING");
    } catch (err) {
      console.error("Failed to load vehicle status:", err);
    }
  };

  loadVehicleStatus();
}, [vehicleId]);

  const toggleVehicle = async () => {
    if (!vehicleId) {
      setError("No vehicle selected.");
      return;
    }

    const newStatus = running ? "OFF" : "RUNNING";

    try {
      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/status`,
        {
          status: newStatus,
        }
      );

      setRunning(!running);
      setError("");
    } catch (err) {
      console.error(
        "Vehicle status update failed:",
        err
      );

      setError(
        "Unable to update vehicle status."
      );
    }
  };

  return (
    <DriverLayout>
      <h1 className="page-heading">
        🚍 Driver Dashboard
      </h1>

      <p className="welcome-text">
        Vehicle: <strong>{vehicleNumber}</strong>
      </p>

      <div className="page-card">
        <h2>🚍 Vehicle Status</h2>

        <div className="vehicle-status-row">
          <span>Vehicle</span>

          <strong>{vehicleNumber}</strong>
        </div>

        <div className="vehicle-status-row">
          <span>Status</span>

          <strong
            className={
              running
                ? "available"
                : "unavailable"
            }
          >
            {running ? "🟢 ON" : "🔴 OFF"}
          </strong>
        </div>

        <button
          className="start-btn"
          onClick={toggleVehicle}
        >
          {running
            ? "Stop Vehicle"
            : "Start Vehicle"}
        </button>

        {error && (
          <p style={{ color: "red" }}>
            ⚠️ {error}
          </p>
        )}
      </div>

      <button
        className="change-vehicle-btn"
        onClick={() =>
          navigate("/driver-select")
        }
      >
        🔄 Change Vehicle
      </button>
    </DriverLayout>
  );
}

export default DriverVehicle;