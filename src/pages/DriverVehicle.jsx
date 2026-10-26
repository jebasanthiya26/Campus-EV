
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverVehicle() {
  const vehicleId = localStorage.getItem("selectedVehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError("No vehicle selected. Please select your vehicle first.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/vehicles/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setVehicle(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load vehicle status."
      );
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const changeStatus = async () => {
    if (!vehicleId) {
      setError("Select a vehicle before changing its status.");
      return;
    }

    const currentStatus = vehicle?.status || "OFF";

    setSaving(true);
    setError("");
    setMessage("");

    try {
      let response;

      if (currentStatus === "OFF") {
        response = await axios.put(
          `${API_URL}/api/vehicles/${vehicleId}/select`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        const nextStatus = currentStatus === "RUNNING" ? "ON" : "OFF";

        response = await axios.put(
          `${API_URL}/api/vehicles/${vehicleId}/status`,
          { status: nextStatus },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      setVehicle(response.data);

      if (response.data.status === "OFF") {
        localStorage.removeItem("selectedLine");
        setMessage(
          "Vehicle is OFF. Select the vehicle again before the next trip."
        );
      } else if (response.data.status === "ON") {
        setMessage(
          "Vehicle is ON and ready. Route, GPS and seats are managed separately."
        );
      } else {
        setMessage("Vehicle status updated.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update vehicle status. Confirm that the vehicle is assigned to your driver account."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="driver-page-v2">
          Loading vehicle status...
        </div>
      </DriverLayout>
    );
  }

  const status = vehicle?.status || "OFF";

  const action =
    status === "OFF"
      ? "Turn ON Vehicle"
      : status === "RUNNING"
      ? "Stop Trip (keep vehicle ON)"
      : "Turn OFF Vehicle";

  const totalSeats = Number(vehicle?.totalSeats || 13);
  const occupiedSeats = Number(vehicle?.occupiedSeats || 0);
  const availableSeats = Math.max(0, totalSeats - occupiedSeats);

  return (
    <DriverLayout>
      <div className="driver-page-v2">
        <section className="driver-page-heading">
          <div>
            <p className="driver-eyebrow">
              STEP 05 · VEHICLE POWER
            </p>
            <h1>Turn ON Vehicle</h1>
            <p>
              {vehicle?.vehicleNumber ||
                localStorage.getItem("selectedVehicleNumber") ||
                "Campus EV"}
            </p>
          </div>

          <span className={`driver-status-pill ${status.toLowerCase()}`}>
            <i />
            {status}
          </span>
        </section>

        {error && (
          <div className="driver-alert driver-alert-error" role="alert">
            ⚠ {error}
            <button type="button" onClick={loadVehicle}>
              Retry
            </button>
          </div>
        )}

        {message && (
          <div className="driver-alert driver-alert-success" role="status">
            ✓ {message}
          </div>
        )}

        <section className="driver-panel-v2 driver-power-panel">
          <div
            className={`driver-power-indicator ${status.toLowerCase()}`}
          >
            <span>⚡</span>
          </div>

          <p className="driver-eyebrow">CURRENT VEHICLE STATUS</p>

          <h2>
            {status === "RUNNING"
              ? "Trip in progress"
              : status === "ON"
              ? "Vehicle is ON and ready"
              : "Vehicle is OFF"}
          </h2>

          <p>
            {status === "OFF"
              ? "Turn the vehicle ON to prepare it for service."
              : status === "ON"
              ? "Vehicle is powered on. Route selection, GPS and seats remain separate steps."
              : "The vehicle is currently in service. You can stop the trip and keep the vehicle ON."}
          </p>

          <div className="driver-power-details">
            <div>
              <small>Route</small>
              <strong>{vehicle?.currentRoute || "Not selected"}</strong>
            </div>

            <div>
              <small>Available seats</small>
              <strong>
                {availableSeats} / {totalSeats}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className={
              status === "ON"
                ? "driver-stop-btn"
                : "driver-primary-btn"
            }
            disabled={saving}
            onClick={changeStatus}
          >
            {saving ? "Updating status..." : action}
          </button>

          <p className="driver-power-note">
            Turning the vehicle ON or OFF does not start or stop GPS.
            Use Turn On Driver GPS separately.
          </p>
        </section>
      </div>
    </DriverLayout>
  );
}

export default DriverVehicle;
