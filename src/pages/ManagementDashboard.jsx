import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import socket from "../socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TABS = [
  { id: "overview", label: "Dashboard", icon: "⌂" },
  { id: "vehicles", label: "Vehicles", icon: "▣" },
  { id: "monitoring", label: "Live monitoring", icon: "⌖" },
];

function ManagementDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const userName = localStorage.getItem("userName") || "Management";

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setVehicles(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load vehicles. Check the backend and MongoDB connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = window.setInterval(fetchVehicles, 5000);
    return () => window.clearInterval(interval);
  }, [fetchVehicles]);

  const logout = () => {
    socket.disconnect();
    ["token", "userId", "userName", "userRole", "selectedVehicleId", "selectedVehicleNumber", "selectedLine", "driverGpsActive"].forEach((key) => localStorage.removeItem(key));
    window.location.replace("/login");
  };

  const stats = useMemo(() => {
    const totalSeats = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.totalSeats || 0), 0);
    const availableSeats = vehicles.reduce((sum, vehicle) => sum + Math.max(0, Number(vehicle.totalSeats || 0) - Number(vehicle.occupiedSeats || 0)), 0);
    return {
      total: vehicles.length,
      running: vehicles.filter((vehicle) => vehicle.status === "RUNNING").length,
      active: vehicles.filter((vehicle) => vehicle.status === "ON").length,
      availableSeats,
      totalSeats,
    };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const matchesSearch = `${vehicle.vehicleNumber || ""} ${vehicle.driver?.name || ""} ${vehicle.driver?.userId || ""} ${vehicle.currentRoute || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "ALL" || (vehicle.status || "OFF") === statusFilter);
  }), [vehicles, search, statusFilter]);

  const renderVehicleCard = (vehicle, showLocation = false) => {
    const total = Number(vehicle.totalSeats || 0);
    const occupied = Number(vehicle.occupiedSeats || 0);
    const available = Math.max(0, total - occupied);
    const location = vehicle.currentLocation;
    const hasCoordinates = location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) && (Number(location.latitude) !== 0 || Number(location.longitude) !== 0);
    const status = vehicle.status || "OFF";
    const updated = vehicle.lastLocationUpdate ? new Date(vehicle.lastLocationUpdate) : null;
    return (
      <article className="management-vehicle-card" key={vehicle._id}>
        <div className="vehicle-card-header">
          <div className="vehicle-title"><div className="vehicle-icon">🚌</div><div><h3>{vehicle.vehicleNumber}</h3><span>Campus electric vehicle</span></div></div>
          <span className={`vehicle-status ${status.toLowerCase()}`}><span />{status}</span>
        </div>
        <div className="vehicle-details">
          <div className="vehicle-detail"><span className="detail-label">Route</span><strong>{vehicle.currentRoute || "Not assigned"}</strong></div>
          <div className="vehicle-detail"><span className="detail-label">Driver</span><strong>{vehicle.driver?.name || "Not assigned"}</strong></div>
          <div className="vehicle-detail"><span className="detail-label">Driver ID</span><strong>{vehicle.driver?.userId || "—"}</strong></div>
          <div className="vehicle-detail"><span className="detail-label">Seat availability</span><strong>{available} available / {total}</strong><div className="seat-progress"><span style={{ width: `${total ? (occupied / total) * 100 : 0}%` }} /></div></div>
        </div>
        {showLocation && <div className="vehicle-location"><div className="location-icon">📍</div><div><span>Latest vehicle location</span>{hasCoordinates ? <strong>{Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}</strong> : <strong className="location-off">Location unavailable</strong>}<small>{updated ? `Updated ${updated.toLocaleTimeString()}` : "No GPS update received yet"}</small></div></div>}
      </article>
    );
  };

  return (
    <div className="management-dashboard management-dashboard-v2">
      <header className="management-topbar">
        <div className="management-brand"><img src="/campus-ev-logo.webp" alt="" className="management-logo" /><span>CampusEV</span></div>
        <div className="management-user"><span className="management-avatar">{userName.charAt(0).toUpperCase()}</span><span>{userName}</span><span className="management-role-tag">Management</span></div>
      </header>
      <div className="management-layout">
        <aside className="management-sidebar">
          <div className="management-menu-title">MANAGEMENT PORTAL</div>
          <nav>{TABS.map((tab) => <button key={tab.id} type="button" className={`management-nav-link ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}><span className="management-nav-icon">{tab.icon}</span><span>{tab.label}</span>{activeTab === tab.id && <span className="management-nav-indicator">●</span>}</button>)}</nav>
          <div className="management-sidebar-footer"><div className="management-refresh-note">Auto-refreshes every 5 seconds</div><button onClick={logout} className="management-logout">↪ <span>Logout</span></button></div>
        </aside>
        <main className="management-main">
          <section className="management-welcome">
            <div><div className="management-eyebrow">CAMPUS FLEET CONTROL</div><h1>{TABS.find((tab) => tab.id === activeTab)?.label || "Dashboard"}</h1><p>Welcome, {userName}. Monitor campus electric vehicles and live fleet data.</p></div>
            <div className="management-live"><span className="live-dot" />Live data <button type="button" className="management-refresh" onClick={fetchVehicles} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></div>
          </section>
          {error && <div className="management-error" role="alert">⚠️ {error} <button type="button" onClick={fetchVehicles}>Retry</button></div>}
          {activeTab === "overview" && <>
            <section className="management-stats">
              <div className="management-stat-card"><div className="stat-icon">🚌</div><div><p>Total vehicles</p><h2>{stats.total}</h2></div></div>
              <div className="management-stat-card"><div className="stat-icon running">▶</div><div><p>Running now</p><h2>{stats.running}</h2></div></div>
              <div className="management-stat-card"><div className="stat-icon active">⚡</div><div><p>Powered on</p><h2>{stats.active}</h2></div></div>
              <div className="management-stat-card"><div className="stat-icon seats">💺</div><div><p>Available seats</p><h2>{stats.availableSeats}<small> / {stats.totalSeats}</small></h2></div></div>
            </section>
            <section className="management-monitoring management-panel-v2"><div className="management-section-header"><div><h2>Fleet overview</h2><p>Quick view of current vehicle status and seat availability</p></div><button className="management-text-button" onClick={() => setActiveTab("vehicles")}>View all vehicles →</button></div>
              {loading ? <div className="management-empty"><div className="management-loader"/><p>Loading fleet data…</p></div> : vehicles.length ? <div className="management-vehicle-grid">{vehicles.slice(0, 4).map((vehicle) => renderVehicleCard(vehicle))}</div> : <div className="management-empty"><div className="empty-icon">🚌</div><h3>No vehicles found</h3><p>Seed or add vehicle records to MongoDB to display the fleet here.</p></div>}
            </section>
            <section className="management-tip-panel"><span>💡</span><div><strong>Demo checklist</strong><p>Assign a vehicle and route in the Driver portal, enable GPS, then open Live monitoring to confirm location updates are arriving.</p></div><button onClick={() => setActiveTab("monitoring")}>Open monitoring →</button></section>
          </>}
          {activeTab === "vehicles" && <section className="management-monitoring management-panel-v2"><div className="management-section-header"><div><h2>Vehicle directory</h2><p>Search the fleet and filter by current status.</p></div><span className="vehicle-count">{filteredVehicles.length} of {vehicles.length}</span></div>
            <div className="management-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicle, driver or route…" aria-label="Search vehicles"/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="ALL">All statuses</option><option value="RUNNING">Running</option><option value="ON">On</option><option value="OFF">Off</option></select></div>
            {loading ? <div className="management-empty"><div className="management-loader"/><p>Loading vehicles…</p></div> : filteredVehicles.length ? <div className="management-vehicle-grid">{filteredVehicles.map((vehicle) => renderVehicleCard(vehicle))}</div> : <div className="management-empty"><h3>No matching vehicles</h3><p>Try a different search or status filter.</p></div>}
          </section>}
          {activeTab === "monitoring" && <section className="management-monitoring management-panel-v2"><div className="management-section-header"><div><h2>Live vehicle monitoring</h2><p>Latest coordinates reported by the driver GPS client.</p></div><span className="vehicle-count">{vehicles.filter((v) => v.status === "RUNNING").length} running</span></div>
            <div className="monitoring-explainer"><span className="live-dot"/><div><strong>Live data is polled from the backend</strong><p>When the driver sends a new GPS fix, the saved coordinates and update time should change here. This page refreshes every 5 seconds.</p></div><small>{lastUpdated ? `Last refresh ${lastUpdated.toLocaleTimeString()}` : "Waiting for first refresh"}</small></div>
            {loading ? <div className="management-empty"><div className="management-loader"/><p>Loading live data…</p></div> : vehicles.length ? <div className="management-vehicle-grid">{vehicles.map((vehicle) => renderVehicleCard(vehicle, true))}</div> : <div className="management-empty"><h3>No vehicle data</h3><p>Check the MongoDB connection and vehicle records.</p></div>}
          </section>}
          <footer className="management-footer">CampusEV Fleet Management <span>•</span> {lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : "Connecting to backend"}</footer>
        </main>
      </div>
    </div>
  );
}
export default ManagementDashboard;
