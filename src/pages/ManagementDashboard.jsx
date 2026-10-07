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
    localStorage.getItem("userName") ||
    "Management";

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
      console.error(
        "Failed to load vehicles:",
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

  useEffect(() => {
    fetchVehicles();

    const interval = setInterval(
      fetchVehicles,
      5000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const runningVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.status === "RUNNING"
    ).length;

  const activeVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.status === "ON"
    ).length;

  const totalSeats = vehicles.reduce(
    (sum, vehicle) =>
      sum + (vehicle.totalSeats || 0),
    0
  );

  const availableSeats =
    vehicles.reduce(
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
    <div className="management-page">

      <header className="management-header">
        <div>
          <h1>Campus EV Management</h1>

          <p>
            Welcome, {userName}
          </p>
        </div>

        <button
          onClick={logout}
          className="change-vehicle-btn"
        >
          Logout
        </button>
      </header>

      <main className="management-content">

        {error && (
          <div className="page-card">
            <p className="login-error">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className="management-stats">

          <div className="page-card">
            <h3>Total Vehicles</h3>
            <strong>
              {vehicles.length}
            </strong>
          </div>

          <div className="page-card">
            <h3>Running Vehicles</h3>
            <strong>
              {runningVehicles}
            </strong>
          </div>

          <div className="page-card">
            <h3>Active Vehicles</h3>
            <strong>
              {activeVehicles}
            </strong>
          </div>

          <div className="page-card">
            <h3>Available Seats</h3>
            <strong>
              {availableSeats} / {totalSeats}
            </strong>
          </div>

        </div>

        <div className="page-card">

          <h2>Vehicle Monitoring</h2>

          {loading ? (
            <p>Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p>
              No vehicles found.
            </p>
          ) : (
            <div className="management-vehicle-list">

              {vehicles.map((vehicle) => {

                const available =
                  Math.max(
                    0,
                    (vehicle.totalSeats || 0) -
                      (vehicle.occupiedSeats || 0)
                  );

                return (
                  <div
                    className="management-vehicle-card"
                    key={vehicle._id}
                  >

                    <div>
                      <h3>
                        {vehicle.vehicleNumber}
                      </h3>

                      <p>
                        Route:{" "}
                        {vehicle.currentRoute ||
                          "Not assigned"}
                      </p>

                      <p>
                        Driver:{" "}
                        {vehicle.driver?.name ||
                          "Not assigned"}
                      </p>

                      <p>
                        Driver ID:{" "}
                        {vehicle.driver?.userId ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p>
                        Status:{" "}
                        <strong>
                          {vehicle.status}
                        </strong>
                      </p>

                      <p>
                        Seats:{" "}
                        {available} available /{" "}
                        {vehicle.totalSeats}
                      </p>

                      <p>
                        Location:{" "}
                        {vehicle.currentLocation
                          ?.latitude || 0}
                        ,{" "}
                        {vehicle.currentLocation
                          ?.longitude || 0}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default ManagementDashboard;