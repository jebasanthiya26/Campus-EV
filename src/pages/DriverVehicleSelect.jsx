import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function DriverVehicleSelect() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/vehicles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVehicles(response.data);
      } catch (err) {
        console.error(
          "Failed to load vehicles:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load vehicles"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [token]);

  const selectVehicle = async (
    vehicleId,
    vehicleNumber
  ) => {
    try {
      setSelecting(vehicleId);
      setError("");

      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/select`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem(
        "selectedVehicleId",
        vehicleId
      );

      localStorage.setItem(
        "selectedVehicleNumber",
        vehicleNumber
      );

      navigate("/driver-dashboard");

    } catch (err) {
      console.error(
        "Vehicle selection failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to select vehicle"
      );
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="driver-select-page">
        <div className="driver-select-container">
          <h1>Campus EV Driver</h1>
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-select-page">
      <div className="driver-select-container">

        <h1>Campus EV Driver</h1>

        <p className="driver-subtitle">
          Select the vehicle assigned to you
        </p>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        {vehicles.map((vehicle) => {
          const isRunning =
            vehicle.status === "RUNNING";

          const isOn =
            vehicle.status === "ON";

          const isActive =
            isRunning || isOn;

          const assignedDriverId =
            vehicle.driver?.userId;

          const isMyVehicle =
            assignedDriverId &&
            currentUserId &&
            String(assignedDriverId) ===
              String(currentUserId);

          const unavailableToMe =
            isActive && !isMyVehicle;

          return (
            <div
              className="vehicle-selection-card"
              key={vehicle._id}
            >
              <div>
                <h3>
                  {vehicle.vehicleNumber}
                </h3>

                <span
                  className={
                    unavailableToMe
                      ? "unavailable"
                      : "available"
                  }
                >
                  {unavailableToMe
                    ? "In Use"
                    : isRunning && isMyVehicle
                    ? "Your Trip is Running"
                    : isOn && isMyVehicle
                    ? "Your Vehicle"
                    : "Available"}
                </span>
              </div>

              <button
                className="select-vehicle-btn"
                disabled={
                  unavailableToMe ||
                  selecting === vehicle._id
                }
                onClick={() =>
                  selectVehicle(
                    vehicle._id,
                    vehicle.vehicleNumber
                  )
                }
              >
                {selecting === vehicle._id
                  ? "Loading..."
                  : unavailableToMe
                  ? "Unavailable"
                  : isRunning && isMyVehicle
                  ? "Continue Trip"
                  : isOn && isMyVehicle
                  ? "Continue"
                  : "Select Vehicle"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DriverVehicleSelect;