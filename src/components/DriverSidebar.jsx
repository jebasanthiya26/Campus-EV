import { NavLink, useNavigate } from "react-router-dom";

function DriverSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="driver-sidebar">
      <div className="driver-brand">
        <div className="brand-icon">EV</div>
        <div>
          <h2>CampusEV</h2>
          <p>Driver Panel</p>
        </div>
      </div>

      <nav className="driver-nav">
        <NavLink
          to="/driver-dashboard"
          className="sidebar-link"
        >
          <span>▣</span>
          Route
        </NavLink>

        <NavLink
          to="/driver-gps"
          className="sidebar-link"
        >
          <span>⌖</span>
          GPS Tracking
        </NavLink>

        <NavLink
          to="/driver-seats"
          className="sidebar-link"
        >
          <span>♙</span>
          Seat Management
        </NavLink>

        <NavLink
          to="/driver-vehicle"
          className="sidebar-link"
        >
          <span>⚡</span>
          Vehicle Status
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userRole");
            navigate("/login");
          }}
        >
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default DriverSidebar;