
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverSeats() {
  const vehicleId = localStorage.getItem("selectedVehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  const [totalSeats, setTotalSeats] = useState(13);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError("No vehicle selected. Select a vehicle first.");
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
      setOccupiedSeats(Number(response.data.occupiedSeats || 0));
      setTotalSeats(Number(response.data.totalSeats || 13));
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load seat data."
      );
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const saveOccupiedSeats = (nextCount) => {
    if (nextCount < 0 || nextCount > totalSeats) return;

    if (!socket.connected) {
      setError("Live connection is not ready. Wait a moment and retry.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    socket.emit("seatUpdate", {
      vehicleId,
      occupiedSeats: nextCount,
    });

    // Verify the saved count from the backend after the update.
    window.setTimeout(async () => {
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
        setOccupiedSeats(Number(response.data.occupiedSeats || 0));
        setTotalSeats(Number(response.data.totalSeats || 13));

        setMessage(
          "Seat count refreshed. Other dashboards can now display the updated count."
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not verify seat update."
        );
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="driver-page-v2">Loading seat details...</div>
      </DriverLayout>
    );
  }

  const availableSeats = Math.max(0, totalSeats - occupiedSeats);

  return (
    <DriverLayout>
      <div className="driver-page-v2">
        <section className="driver-page-heading">
          <div>
            <p className="driver-eyebrow">
              STEP 04 · PASSENGER COUNT
            </p>
            <h1>Update Vehicle Seats</h1>
            <p>
              {vehicle?.vehicleNumber || "Campus EV"} ·{" "}
              {totalSeats}-seater vehicle
            </p>
          </div>

          <span className="driver-status-pill running">
            <i />
            {availableSeats} available
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

        <section className="driver-section-grid driver-seat-summary-grid">
          <article className="driver-panel-v2">
            <p className="driver-eyebrow">AVAILABLE SEATS</p>
            <h2 className="driver-seat-number available-text">
              {availableSeats}
            </h2>
            <p>Green seats are available.</p>
          </article>

          <article className="driver-panel-v2">
            <p className="driver-eyebrow">OCCUPIED SEATS</p>
            <h2 className="driver-seat-number occupied-text">
              {occupiedSeats}
            </h2>
            <p>Red seats are occupied.</p>
          </article>
        </section>

        <section className="driver-panel-v2">
          <div className="driver-panel-heading">
            <div>
              <h2>Seat map · {totalSeats} seats</h2>
              <p>
                Use Add Passenger or Remove Passenger to update
                the occupied count.
              </p>
            </div>

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
          </div>

          <div className="driver-seat-grid" aria-label="Seat occupancy map">
            {Array.from({ length: totalSeats }, (_, index) => {
              const occupied = index < occupiedSeats;

              return (
                <div
                  key={index}
                  className={`driver-seat-tile ${
                    occupied ? "occupied" : "available"
                  }`}
                  title={`Seat ${index + 1}: ${
                    occupied ? "occupied" : "available"
                  }`}
                >
                  <span>{occupied ? "●" : "✓"}</span>
                  <b>{index + 1}</b>
                  <small>
                    {occupied ? "Occupied" : "Available"}
                  </small>
                </div>
              );
            })}
          </div>

          <div className="driver-seat-actions">
            <button
              type="button"
              className="driver-stop-btn"
              disabled={saving || occupiedSeats <= 0}
              onClick={() => saveOccupiedSeats(occupiedSeats - 1)}
            >
              − Remove Passenger
            </button>

            <strong>
              {occupiedSeats} / {totalSeats} occupied
            </strong>

            <button
              type="button"
              className="driver-primary-btn"
              disabled={saving || occupiedSeats >= totalSeats}
              onClick={() => saveOccupiedSeats(occupiedSeats + 1)}
            >
              + Add Passenger
            </button>
          </div>
        </section>
      </div>
    </DriverLayout>
  );
}

export default DriverSeats;
