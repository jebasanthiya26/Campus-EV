import { NavLink, useNavigate } from "react-router-dom";

function DriverSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="driver-sidebar">
      <div className="driver-brand">
        <h2>🚌 Campus EV</h2>
        <p>Driver Panel</p>
      </div>

      <div className="driver-nav">
        <NavLink
          to="/driver-dashboard"
          className="sidebar-link"
        >
          🗺️ Route
        </NavLink>

        <NavLink
          to="/driver-gps"
          className="sidebar-link"
        >
          📍 GPS
        </NavLink>

        <NavLink
          to="/driver-seats"
          className="sidebar-link"
        >
          💺 Seats
        </NavLink>

        <NavLink
          to="/driver-vehicle"
          className="sidebar-link"
        >
          🚌 Start Vehicle
        </NavLink>
      </div>

      <button
        className="logout-btn"
        onClick={() => navigate("/login")}
      >
        🚪 Logout
      </button>
    </aside>
  );
}

export default DriverSidebar;