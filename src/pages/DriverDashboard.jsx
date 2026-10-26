
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import DriverLayout from "../components/DriverLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROUTES = {
  "Green Line": [
    "Hostel Mess",
    "Department of MBA",
    "SBI ATM",
    "Dean Office",
    "Soil Mechanics",
    "Department of Mechanical",
  ],
  "Blue Line": [
    "Main Gate",
    "Dean Office",
    "HighVoltage",
    "NCC Office",
    "Department of Printing Tech",
    "International Hostel",
    "Mess Gate",
    "Kottupuram Gate",
  ],
};

function DriverDashboard() {
  const navigate = useNavigate();
  const vehicleId = localStorage.getItem("selectedVehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setVehicle(null);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/vehicles/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setVehicle(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicle information. Check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  if (loading) {
    return (
      <DriverLayout>
        <div className="driver-page-v2">
          Loading driver overview...
        </div>
      </DriverLayout>
    );
  }

  if (!vehicleId) {
    return (
      <DriverLayout>
        <div className="driver-page-v2">
          <section className="driver-page-heading">
            <div>
              <p className="driver-eyebrow">
                DRIVER CONTROL CENTER
              </p>
              <h1>Overview</h1>
              <p>Select your assigned campus EV to continue.</p>
            </div>
          </section>

          {error && (
            <div className="driver-alert driver-alert-error">
              {error}
            </div>
          )}

          <button
            className="driver-primary-btn"
            type="button"
            onClick={() => navigate("/driver-select")}
          >
            Select Vehicle
          </button>
        </div>
      </DriverLayout>
    );
  }

  const status = vehicle?.status || "OFF";
  const totalSeats = Number(vehicle?.totalSeats ?? 13);
  const occupiedSeats = Number(vehicle?.occupiedSeats ?? 0);
  const availableSeats = Math.max(
    0,
    totalSeats - occupiedSeats
  );
  const currentRoute = vehicle?.currentRoute || "Not selected";

  return (
    <DriverLayout>
      <div className="driver-page-v2">
        <section className="driver-page-heading">
          <div>
            <p className="driver-eyebrow">
              DRIVER CONTROL CENTER
            </p>
            <h1>
              {vehicle?.vehicleNumber ||
                localStorage.getItem("selectedVehicleNumber") ||
                "Campus EV"}
            </h1>
            <p>
              Overview of campus routes, vehicle state and
              seat availability.
            </p>
          </div>

          <span
            className={`driver-status-pill ${status.toLowerCase()}`}
          >
            <i />
            {status}
          </span>
        </section>

        {error && (
          <div
            className="driver-alert driver-alert-error"
            role="alert"
          >
            ⚠ {error}
            <button type="button" onClick={loadVehicle}>
              Retry
            </button>
          </div>
        )}

        <section className="driver-status-hero">
          <div>
            <span className="driver-eyebrow">
              CURRENT VEHICLE
            </span>

            <h2>
              {status === "RUNNING"
                ? "Vehicle is running"
                : status === "ON"
                ? "Vehicle is ON and ready"
                : "Vehicle is OFF"}
            </h2>

            <p>Selected route: {currentRoute}</p>

            <p>
              {availableSeats} seats available out of{" "}
              {totalSeats}
            </p>
          </div>

          <div className="driver-hero-bus" aria-hidden="true">
            🚌
          </div>
        </section>

        <section className="driver-section-grid driver-overview-stats">
          <article className="driver-panel-v2">
            <p className="driver-eyebrow">VEHICLE STATUS</p>
            <h2>{status}</h2>
            <p>
              Use Turn ON Vehicle to control the vehicle
              power and trip status.
            </p>
          </article>

          <article className="driver-panel-v2">
            <p className="driver-eyebrow">AVAILABLE SEATS</p>
            <h2>
              {availableSeats} / {totalSeats}
            </h2>
            <p>
              {occupiedSeats} occupied · Green = available,
              red = occupied.
            </p>

            <div className="driver-seat-legend">
              <span>
                <i className="seat-dot available" />
                Available
              </span>
              <span>
                <i className="seat-dot occupied" />
                Occupied
              </span>
            </div>
          </article>
        </section>

        <section className="driver-panel-v2 driver-overview-routes">
          <div className="driver-panel-heading">
            <div>
              <h2>Campus routes and stops</h2>
              <p>
                Review both routes here. Select the active route
                from the separate Route sidebar section.
              </p>
            </div>

            <Link
              className="driver-inline-link"
              to="/driver-route"
            >
              Select route →
            </Link>
          </div>

          <div className="driver-overview-route-grid">
            {Object.entries(ROUTES).map(([name, stops]) => (
              <article
                className={`driver-overview-route ${
                  name === "Green Line"
                    ? "green-line"
                    : "blue-line"
                }`}
                key={name}
              >
                <h3>
                  <i className="route-dot" />
                  {name}

                  {currentRoute === name && (
                    <span className="driver-selected-tag">
                      Selected
                    </span>
                  )}
                </h3>

                <ol>
                  {stops.map((stop) => (
                    <li key={stop}>{stop}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="driver-panel-v2">
          <div className="driver-panel-heading">
            <div>
              <h2>Driver workflow</h2>
              <p>
                Complete each step using the matching sidebar
                section.
              </p>
            </div>
          </div>

          <div className="driver-workflow-grid">
            <Link to="/driver-route">
              <b>02</b>
              <h3>Route</h3>
              <p>Select Green Line or Blue Line.</p>
              <span>Open Route →</span>
            </Link>

            <Link to="/driver-gps">
              <b>03</b>
              <h3>Turn On Driver GPS</h3>
              <p>Start phone GPS or demo movement.</p>
              <span>Open GPS →</span>
            </Link>

            <Link to="/driver-seats">
              <b>04</b>
              <h3>Update Vehicle Seats</h3>
              <p>Update the occupied seat count.</p>
              <span>Update seats →</span>
            </Link>

            <Link to="/driver-vehicle">
              <b>05</b>
              <h3>Turn ON Vehicle</h3>
              <p>Control the vehicle power and trip state.</p>
              <span>Vehicle power →</span>
            </Link>
          </div>
        </section>

        <button
          type="button"
          className="driver-secondary-btn"
          onClick={loadVehicle}
        >
          ↻ Refresh overview
        </button>
      </div>
    </DriverLayout>
  );
}

export default DriverDashboard;
