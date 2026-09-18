import { useEffect, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverDashboard() {
  const [vehicle, setVehicle] = useState(null);

  const vehicleId =
    localStorage.getItem("selectedVehicleId");

  const vehicleNumber =
    localStorage.getItem("selectedVehicleNumber") ||
    "Campus EV";

  const driverName =
    localStorage.getItem("userName") ||
    "Driver";

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;

      try {
        const response = await axios.get(
          `${API_URL}/api/vehicles/${vehicleId}`
        );

        setVehicle(response.data);
      } catch (error) {
        console.error(
          "Failed to load vehicle:",
          error
        );
      }
    };

    loadVehicle();
  }, [vehicleId]);

  const totalSeats = vehicle?.totalSeats || 13;
  const occupiedSeats = vehicle?.occupiedSeats || 0;
  const availableSeats =
    totalSeats - occupiedSeats;

  const isRunning =
    vehicle?.status === "RUNNING";

  const gpsActive =
    vehicle?.currentLocation?.latitude !== 0 &&
    vehicle?.currentLocation?.longitude !== 0;

  return (
    <DriverLayout>
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">
            DRIVER DASHBOARD
          </p>

          <h1 className="page-heading">
            Welcome, {driverName}
          </h1>

          <p className="welcome-text">
            Here's an overview of your assigned
            CampusEV vehicle.
          </p>
        </div>

        <div className="driver-avatar">
          {driverName.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="driver-stats">

        <div className="stat-card">
          <div className="stat-icon">EV</div>

          <div>
            <p>Vehicle</p>
            <h3>{vehicleNumber}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">●</div>

          <div>
            <p>Status</p>

            <h3 className={
              isRunning
                ? "status-running"
                : "status-off"
            }>
              {isRunning ? "RUNNING" : "OFF"}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">S</div>

          <div>
            <p>Seats</p>

            <h3>
              {occupiedSeats} / {totalSeats}
            </h3>

            <small>
              {availableSeats} available
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">GPS</div>

          <div>
            <p>GPS</p>

            <h3 className={
              gpsActive
                ? "status-running"
                : "status-off"
            }>
              {gpsActive ? "Active" : "Waiting"}
            </h3>
          </div>
        </div>

      </div>

      <div className="current-route-card">
        <p className="section-label">
          CURRENT ROUTE
        </p>

        <h2>
          {vehicle?.currentRoute || "Blue Line"}
        </h2>

        <p>
          Your currently assigned CampusEV route
        </p>
      </div>

      <div className="quick-access">
        <p className="section-label">
          QUICK ACCESS
        </p>

        <h2>Manage Vehicle</h2>

        <div className="quick-buttons">

          <a href="/driver-gps">
            📍
            <span>
              <strong>GPS Tracking</strong>
              <small>
                View and share live location
              </small>
            </span>
          </a>

          <a href="/driver-seats">
            💺
            <span>
              <strong>Seat Management</strong>
              <small>
                Update passenger count
              </small>
            </span>
          </a>

          <a href="/driver-vehicle">
            ⚡
            <span>
              <strong>Vehicle Status</strong>
              <small>
                Start or stop your vehicle
              </small>
            </span>
          </a>

        </div>
      </div>
    </DriverLayout>
  );
}

export default DriverDashboard;