
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function ManagementDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const userName =
    localStorage.getItem("userName") || "Management";

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
      setError("");
    } catch (err) {
      console.error("Failed to load vehicles:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load vehicle data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();

    const interval = setInterval(
      fetchVehicles,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const runningVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "RUNNING"
  ).length;

  const activeVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "ON"
  ).length;

  const totalSeats = vehicles.reduce(
    (sum, vehicle) =>
      sum + (vehicle.totalSeats || 0),
    0
  );

  const availableSeats = vehicles.reduce(
    (sum, vehicle) =>
      sum +
      Math.max(
        0,
        (vehicle.totalSeats || 0) -
          (vehicle.occupiedSeats || 0)
      ),
    0
  );

  return (
    <div className="management-dashboard">

      {/* TOP HEADER */}
      <header className="management-topbar">
        <div className="management-brand">
          <span className="management-brand-icon">
            🚌
          </span>
          <span>Campus EV</span>
        </div>

        <div className="management-user">
          <span>👤</span>
          <span>Management</span>
        </div>
      </header>

      <div className="management-layout">

        {/* SIDEBAR */}
        <aside className="management-sidebar">

          <div className="management-menu-title">
            MANAGEMENT
          </div>

          <nav>

            <a
              href="#dashboard"
              className="management-nav-link active"
            >
              🏠
              <span>Dashboard</span>
            </a>

            <a
              href="#vehicles"
              className="management-nav-link"
            >
              🚌
              <span>Vehicles</span>
            </a>

            <a
              href="#monitoring"
              className="management-nav-link"
            >
              📍
              <span>Monitoring</span>
            </a>

          </nav>

          <button
            onClick={logout}
            className="management-logout"
          >
            🚪
            <span>Logout</span>
          </button>

        </aside>

        {/* MAIN CONTENT */}
        <main className="management-main">

          <section
            className="management-welcome"
            id="dashboard"
          >
            <div>
              <h1>Management Dashboard</h1>

              <p>
                Welcome, {userName}. Monitor and manage
                campus electric vehicles.
              </p>
            </div>

            <div className="management-live">
              <span className="live-dot"></span>
              Live Monitoring
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div className="management-error">
              ⚠️ {error}
            </div>
          )}

          {/* STATISTICS */}
          <section className="management-stats">

            <div className="management-stat-card">
              <div className="stat-icon">
                🚌
              </div>

              <div>
                <p>Total Vehicles</p>
                <h2>{vehicles.length}</h2>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="stat-icon running">
                ▶
              </div>

              <div>
                <p>Running Vehicles</p>
                <h2>{runningVehicles}</h2>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="stat-icon active">
                ⚡
              </div>

              <div>
                <p>Active Vehicles</p>
                <h2>{activeVehicles}</h2>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="stat-icon seats">
                💺
              </div>

              <div>
                <p>Available Seats</p>
                <h2>
                  {availableSeats}
                  <small> / {totalSeats}</small>
                </h2>
              </div>
            </div>

          </section>

          {/* VEHICLE MONITORING */}
          <section
            className="management-monitoring"
            id="monitoring"
          >

            <div className="management-section-header">
              <div>
                <h2>Vehicle Monitoring</h2>
                <p>
                  Real-time status of campus EVs
                </p>
              </div>

              <span className="vehicle-count">
                {vehicles.length} Vehicles
              </span>
            </div>

            {loading ? (
              <div className="management-empty">
                <div className="management-loader"></div>
                <p>Loading vehicle data...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="management-empty">
                <div className="empty-icon">
                  🚌
                </div>

                <h3>No vehicles found</h3>

                <p>
                  There are currently no vehicles
                  registered in the system.
                </p>
              </div>
            ) : (
              <div
                className="management-vehicle-grid"
                id="vehicles"
              >

                {vehicles.map((vehicle) => {

                  const available = Math.max(
                    0,
                    (vehicle.totalSeats || 0) -
                      (vehicle.occupiedSeats || 0)
                  );

                  const status =
                    vehicle.status || "OFF";

                  const statusClass =
                    status.toLowerCase();

                  const hasLocation =
                    vehicle.currentLocation
                      ?.latitude !== undefined &&
                    vehicle.currentLocation
                      ?.longitude !== undefined;

                  return (
                    <article
                      className="management-vehicle-card"
                      key={vehicle._id}
                    >

                      {/* VEHICLE HEADER */}
                      <div className="vehicle-card-header">

                        <div className="vehicle-title">

                          <div className="vehicle-icon">
                            🚌
                          </div>

                          <div>
                            <h3>
                              {vehicle.vehicleNumber}
                            </h3>

                            <span>
                              Electric Campus Vehicle
                            </span>
                          </div>

                        </div>

                        <span
                          className={`vehicle-status ${statusClass}`}
                        >
                          <span></span>
                          {status}
                        </span>

                      </div>

                      {/* VEHICLE DETAILS */}
                      <div className="vehicle-details">

                        <div className="vehicle-detail">
                          <span className="detail-label">
                            Route
                          </span>

                          <strong>
                            {vehicle.currentRoute ||
                              "Not assigned"}
                          </strong>
                        </div>

                        <div className="vehicle-detail">
                          <span className="detail-label">
                            Driver
                          </span>

                          <strong>
                            {vehicle.driver?.name ||
                              "Not assigned"}
                          </strong>
                        </div>

                        <div className="vehicle-detail">
                          <span className="detail-label">
                            Driver ID
                          </span>

                          <strong>
                            {vehicle.driver?.userId ||
                              "—"}
                          </strong>
                        </div>

                        <div className="vehicle-detail">
                          <span className="detail-label">
                            Seats
                          </span>

                          <strong>
                            {available} available /{" "}
                            {vehicle.totalSeats || 0}
                          </strong>
                        </div>

                      </div>

                      {/* GPS */}
                      <div className="vehicle-location">

                        <div className="location-icon">
                          📍
                        </div>

                        <div>
                          <span>
                            Current Location
                          </span>

                          {hasLocation ? (
                            <strong>
                              {vehicle.currentLocation.latitude.toFixed(
                                6
                              )}
                              ,{" "}
                              {vehicle.currentLocation.longitude.toFixed(
                                6
                              )}
                            </strong>
                          ) : (
                            <strong className="location-off">
                              Location unavailable
                            </strong>
                          )}
                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>

        </main>
      </div>
    </div>
  );
}

export default ManagementDashboard;
