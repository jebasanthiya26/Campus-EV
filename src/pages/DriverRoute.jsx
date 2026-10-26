
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
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

function DriverRoute() {
  const vehicleId = localStorage.getItem("selectedVehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [selectedLine, setSelectedLine] = useState(
    localStorage.getItem("selectedLine") || ""
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError("Please select a vehicle first.");
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

      if (response.data.currentRoute) {
        setSelectedLine(response.data.currentRoute);
        localStorage.setItem(
          "selectedLine",
          response.data.currentRoute
        );
      }

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vehicle. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const saveRoute = async () => {
    if (!selectedLine) {
      setError("Select Green Line or Blue Line first.");
      return;
    }

    if (vehicle?.status === "RUNNING") {
      setError("Stop the vehicle before changing its route.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/route`,
        { route: selectedLine },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setVehicle(response.data);
      localStorage.setItem("selectedLine", selectedLine);
      setMessage(`${selectedLine} selected successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Route could not be saved. Check the backend route endpoint."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="driver-page-v2">Loading routes...</div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <main className="driver-page-v2">
        <section className="driver-page-heading">
          <div>
            <p className="driver-eyebrow">STEP 02 · ROUTE SETUP</p>
            <h1>Select EV Route</h1>
            <p>
              {vehicle?.vehicleNumber || "Campus EV"}
            </p>
          </div>
        </section>

        {error && (
          <div className="driver-alert driver-alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="driver-alert driver-alert-success" role="status">
            {message}
          </div>
        )}

        <div className="driver-overview-route-grid">
          {Object.entries(ROUTES).map(([line, stops]) => (
            <button
              type="button"
              key={line}
              disabled={saving || vehicle?.status === "RUNNING"}
              onClick={() => {
                setSelectedLine(line);
                setMessage("");
                setError("");
              }}
              className={`driver-overview-route route-choice ${
                line === "Green Line" ? "green-line" : "blue-line"
              } ${selectedLine === line ? "chosen" : ""}`}
            >
              <h3>
                <i className="route-dot" />
                {line}
                {selectedLine === line && " ✓ Selected"}
              </h3>

              <ol>
                {stops.map((stop) => (
                  <li key={stop}>{stop}</li>
                ))}
              </ol>
            </button>
          ))}
        </div>

        <section className="driver-panel-v2 driver-route-save-panel">
          <h2>Confirm your route</h2>
          <p>
            Selected line: <strong>{selectedLine || "None"}</strong>
          </p>

          <button
            type="button"
            className="driver-primary-btn"
            disabled={
              saving ||
              !selectedLine ||
              !vehicleId ||
              vehicle?.status === "RUNNING"
            }
            onClick={saveRoute}
          >
            {saving ? "Saving..." : "Save Selected Route"}
          </button>
        </section>
      </main>
    </DriverLayout>
  );
}

export default DriverRoute;
