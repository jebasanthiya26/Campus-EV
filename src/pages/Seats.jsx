import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Seats() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadVehicles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicles`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setVehicles(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load seat availability.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    loadVehicles();
    const timer = window.setInterval(loadVehicles, 7000);
    return () => window.clearInterval(timer);
  }, [loadVehicles]);

  return <StudentLayout>
    <div className="student-dashboard-v2">
      <p className="student-eyebrow">PLAN YOUR RIDE</p>
      <h1 className="page-heading">Seat availability</h1>
      <p className="welcome-text">Live seat counts are read from the vehicle records and refreshed automatically.</p>
      {error && <div className="student-alert" role="alert">⚠️ {error} <button onClick={loadVehicles}>Retry</button></div>}
      {loading ? <div className="page-card">Loading seat availability…</div> : vehicles.length ? <div className="student-fleet-grid seats-live-grid">{vehicles.map((vehicle) => {
        const total = Math.max(0, Number(vehicle.totalSeats || 0));
        const occupied = Math.min(total, Math.max(0, Number(vehicle.occupiedSeats || 0)));
        const available = total - occupied;
        return <section className="page-card seats-live-card" key={vehicle._id}><div className="student-panel-heading"><div><h2>{vehicle.vehicleNumber}</h2><p>{vehicle.currentRoute || "Route not assigned"}</p></div><span className={`student-status status-${String(vehicle.status || "OFF").toLowerCase()}`}>{vehicle.status || "OFF"}</span></div><div className="seat-summary">{available} <small>available of {total}</small></div><div className="seat-grid seats-live-seats">{Array.from({ length: total }, (_, index) => <div key={index} className={`seat ${index < occupied ? "booked" : "seat-free"}`} title={index < occupied ? "Occupied" : "Available"}>{index + 1}</div>)}</div><p className="seat-legend"><span className="legend-occupied"/> Occupied <span className="legend-free"/> Available</p></section>;
      })}</div> : <div className="page-card">No vehicles found.</div>}
    </div>
  </StudentLayout>;
}
export default Seats;
