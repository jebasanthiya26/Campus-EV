import { useEffect, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverGPS() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState(
    "Waiting for GPS..."
  );
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
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

          socket.emit(
            "gpsUpdate",
            gpsData
          );

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

  const vehicleNumber =
    localStorage.getItem(
      "selectedVehicleNumber"
    ) || "Campus EV";

  const driverName =
    localStorage.getItem("userName") ||
    "Driver";

  const isActive =
    gpsStatus === "GPS Active";

  return (
    <DriverLayout>
      <div className="gps-page">

        {/* Header */}

        <div className="dashboard-header">
          <div>
            <p className="dashboard-label">
              GPS TRACKING
            </p>

            <h1 className="page-heading">
              Driver GPS
            </h1>

            <p className="welcome-text">
              Share your live location with the
              CampusEV system.
            </p>
          </div>

          <div className="driver-avatar">
            {driverName
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>


        {/* GPS Status */}

        <div className="gps-status-card">

          <div className="gps-status-left">

            <div
              className={
                isActive
                  ? "gps-icon active"
                  : "gps-icon"
              }
            >
              GPS
            </div>

            <div>
              <h2>
                {isActive
                  ? "GPS Active"
                  : gpsStatus}
              </h2>

              <p>
                {isActive
                  ? "Your phone location is being shared with CampusEV."
                  : "Waiting for your phone location."}
              </p>
            </div>

          </div>

          <div
            className={
              isActive
                ? "gps-live-badge"
                : "gps-wait-badge"
            }
          >
            <span></span>

            {isActive
              ? "LIVE"
              : "WAITING"}
          </div>

        </div>


        {/* GPS Information */}

        <div className="gps-info-grid">

          <div className="gps-info-card">
            <span>VEHICLE</span>
            <strong>{vehicleNumber}</strong>
          </div>

          <div className="gps-info-card">
            <span>LATITUDE</span>
            <strong>
              {location
                ? location.latitude.toFixed(6)
                : "--"}
            </strong>
          </div>

          <div className="gps-info-card">
            <span>LONGITUDE</span>
            <strong>
              {location
                ? location.longitude.toFixed(6)
                : "--"}
            </strong>
          </div>

          <div className="gps-info-card">
            <span>ACCURACY</span>
            <strong>
              {location
                ? `${Math.round(
                    location.accuracy
                  )} m`
                : "--"}
            </strong>
          </div>

        </div>


        {/* Live Location */}

        <div className="gps-location-card">

          <div className="gps-card-header">
            <div>
              <p className="section-label">
                LIVE LOCATION
              </p>

              <h2>
                Location Sharing
              </h2>
            </div>

            <div className="location-pulse">
              ●
            </div>
          </div>

          <div className="location-display">

            <div className="location-marker">
              ⌖
            </div>

            <div>
              <strong>
                {isActive
                  ? "Your location is being shared"
                  : "Location not available"}
              </strong>

              <p>
                Students can view the live
                location of this vehicle on
                the tracking page.
              </p>
            </div>

          </div>

          {location && (
            <div className="coordinates-box">
              <span>
                Current Coordinates
              </span>

              <strong>
                {location.latitude.toFixed(6)}
                {" , "}
                {location.longitude.toFixed(6)}
              </strong>
            </div>
          )}

        </div>


        {/* Error */}

        {error && (
          <div className="gps-error">
            <strong>GPS Error</strong>
            <p>{error}</p>
          </div>
        )}

      </div>
    </DriverLayout>
  );
}

export default DriverGPS;