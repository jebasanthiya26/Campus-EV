import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import socket from "../socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StudentDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicles`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setVehicles(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Vehicle data is unavailable. Check the backend connection.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = window.setInterval(fetchVehicles, 7000);
    const handleLocation = (update) => setVehicles((current) => current.map((vehicle) => String(vehicle._id) === String(update.vehicleId) ? { ...vehicle, status: update.status || vehicle.status, currentRoute: update.currentRoute ?? vehicle.currentRoute, occupiedSeats: update.occupiedSeats ?? vehicle.occupiedSeats, totalSeats: update.totalSeats ?? vehicle.totalSeats, currentLocation: { ...(vehicle.currentLocation || {}), latitude: update.latitude, longitude: update.longitude, accuracy: update.accuracy }, lastLocationUpdate: update.updatedAt || new Date().toISOString() } : vehicle));
    socket.auth = { token: localStorage.getItem("token") };
    socket.on("vehicleLocation", handleLocation);
    socket.on("vehicleStatusUpdated", fetchVehicles);
    if (!socket.connected) socket.connect();
    return () => { window.clearInterval(interval); socket.off("vehicleLocation", handleLocation); socket.off("vehicleStatusUpdated", fetchVehicles); };
  }, [fetchVehicles]);

  const running = vehicles.filter((vehicle) => vehicle.status === "RUNNING").length;
  const seatsAvailable = vehicles.reduce((sum, vehicle) => sum + Math.max(0, Number(vehicle.totalSeats || 0) - Number(vehicle.occupiedSeats || 0)), 0);
  const firstRunning = vehicles.find((vehicle) => vehicle.status === "RUNNING") || vehicles[0];
  const role = localStorage.getItem("userRole") === "faculty" ? "Faculty" : "Student";
  return (
    <StudentLayout>
      <div className="student-dashboard-v2">
        <section className="student-welcome-panel"><div><p className="student-eyebrow">CAMPUS TRANSPORT, AT A GLANCE</p><h1 className="page-heading">Welcome to CampusEV 👋</h1><p className="welcome-text">Find a campus EV, follow its live location, and check seats before you travel.</p></div><div className="student-welcome-illustration">🚌</div></section>
        {error && <div className="student-alert" role="alert">⚠️ {error} <button onClick={fetchVehicles}>Retry</button></div>}
        
        <section className="student-fleet-panel"><div className="student-panel-heading"><div><h2>Campus fleet</h2><p>Vehicle status updates automatically.</p></div><span className="student-live-pill"><i/> Live</span></div>
          {loading ? <div className="student-empty-state">Loading vehicles…</div> : vehicles.length === 0 ? <div className="student-empty-state">No vehicles are available right now.</div> : <div className="student-fleet-grid">{vehicles.map((vehicle) => {
            const available = Math.max(0, Number(vehicle.totalSeats || 0) - Number(vehicle.occupiedSeats || 0));
            const location = vehicle.currentLocation || {};
            const hasLocation = Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) && (Number(location.latitude) !== 0 || Number(location.longitude) !== 0);
            return <article className="student-fleet-card" key={vehicle._id}><div className="student-fleet-card-top"><div className="student-fleet-bus">🚌</div><div className="student-fleet-title"><h3>{vehicle.vehicleNumber}</h3><p>{vehicle.currentRoute || "Route not assigned"}</p></div><span className={`student-status status-${String(vehicle.status || "OFF").toLowerCase()}`}>{vehicle.status || "OFF"}</span></div><div className="student-fleet-metrics"><div><small>Seats free</small><strong>{available} / {vehicle.totalSeats || 0}</strong></div><div><small>Location</small><strong>{hasLocation ? `${Number(location.latitude).toFixed(4)}, ${Number(location.longitude).toFixed(4)}` : "Waiting for GPS"}</strong></div></div><Link className="student-track-link" to="/tracking">Track this vehicle <span>→</span></Link></article>;
          })}</div>}
        </section>
        <section className="student-quick-actions"><Link to="/tracking"><span>📍</span><div><strong>Live tracking</strong><small>See vehicles on the map</small></div><b>→</b></Link><Link to="/routes"><span>🗺️</span><div><strong>Routes & stops</strong><small>Review campus routes</small></div><b>→</b></Link><Link to="/seats"><span>💺</span><div><strong>Seat availability</strong><small>Check seats before boarding</small></div><b>→</b></Link></section>
        <p className="student-sync-note">{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Connecting to live fleet data…"}{firstRunning ? ` • ${firstRunning.vehicleNumber} ${firstRunning.status === "RUNNING" ? "is currently running" : "is registered"}` : ""}</p>
      </div>
    </StudentLayout>
  );
}
export default StudentDashboard;
