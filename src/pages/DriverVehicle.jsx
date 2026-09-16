import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverLayout from "../components/DriverLayout";

function DriverVehicle() {
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  return (
    <DriverLayout>
      <h1 className="page-heading">
        🚌 Driver Dashboard
      </h1>

      <p className="welcome-text">
        Vehicle: <strong>Campus EV-02</strong>
      </p>

      <div className="page-card">
        <h2>🚌 Vehicle Status</h2>

        <div className="vehicle-status-row">
          <span>Vehicle</span>
          <strong>Campus EV-02</strong>
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
          onClick={() => setRunning(!running)}
        >
          {running
            ? "Stop Vehicle"
            : "Start Vehicle"}
        </button>
      </div>

      <button
        className="change-vehicle-btn"
        onClick={() => navigate("/driver-select")}
      >
        🔄 Change Vehicle
      </button>
    </DriverLayout>
  );
}

export default DriverVehicle;