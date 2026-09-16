import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverGPS() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("Waiting for GPS...");
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    // Get selected vehicle from localStorage
    const savedVehicleId =
      localStorage.getItem("selectedVehicleId");

    if (savedVehicleId) {
      setVehicleId(savedVehicleId);
    } else {
      setError(
        "No vehicle selected. Please select a vehicle first."
      );
    }
  }, []);

  useEffect(() => {
    if (!vehicleId) return;

    if (!navigator.geolocation) {
      setError(
        "GPS is not supported by this browser."
      );
      return;
    }

    setGpsStatus("Getting your phone GPS...");

    const watchId =
      navigator.geolocation.watchPosition(
        async (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracy =
            position.coords.accuracy;

          const gpsData = {
            vehicleId,
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
          };

          setLocation({
            latitude,
            longitude,
            accuracy,
          });

          setGpsStatus("GPS Active");

          // Send live location through Socket.IO
          socket.emit(
            "gpsUpdate",
            gpsData
          );

          // Save latest location in MongoDB
          try {
            await axios.put(
              `${API_URL}/api/vehicles/${vehicleId}/gps`,
              {
                latitude,
                longitude,
                locationName: "Live GPS",
              }
            );
          } catch (err) {
            console.error(
              "GPS database update failed:",
              err
            );
          }
        },

        (err) => {
          console.error(
            "GPS Error:",
            err
          );

          setGpsStatus("GPS Error");

          if (err.code === 1) {
            setError(
              "Location permission denied. Please allow GPS permission."
            );
          } else if (err.code === 2) {
            setError(
              "Unable to get your current location."
            );
          } else if (err.code === 3) {
            setError(
              "GPS request timed out."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [vehicleId]);

  return (
    <div className="page">
      <h1>📍 Driver GPS</h1>

      <p>
        Vehicle ID:{" "}
        <strong>
          {vehicleId || "Not selected"}
        </strong>
      </p>

      <div className="card">
        <h2>📡 GPS Status</h2>

        <p>
          <strong>{gpsStatus}</strong>
        </p>

        {location && (
          <>
            <p>
              Latitude:{" "}
              <strong>
                {location.latitude}
              </strong>
            </p>

            <p>
              Longitude:{" "}
              <strong>
                {location.longitude}
              </strong>
            </p>

            <p>
              Accuracy:{" "}
              <strong>
                {Math.round(
                  location.accuracy
                )}{" "}
                metres
              </strong>
            </p>
          </>
        )}

        {error && (
          <p
            style={{
              color: "red",
            }}
          >
            ⚠️ {error}
          </p>
        )}
      </div>

      <div className="card">
        <h2>🚍 Live Tracking</h2>

        <p>
          Your phone GPS location is being
          shared with the Campus EV system.
        </p>

        <p>
          Students will be able to see this
          vehicle's live location.
        </p>
      </div>
    </div>
  );
}

export default DriverGPS;