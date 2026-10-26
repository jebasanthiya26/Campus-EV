
import { NavLink, useNavigate } from "react-router-dom";
import socket from "../socket";

function DriverSidebar() {
  const navigate = useNavigate();

  const logout = () => {
    socket.disconnect();

    [
      "token",
      "userId",
      "userName",
      "userRole",
      "selectedVehicleId",
      "selectedVehicleNumber",
      "selectedLine",
      "driverGpsActive",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="driver-sidebar">
      <div className="driver-brand">
        <img
          className="driver-brand-logo"
          src="/campus-ev-logo.webp"
          alt="CampusEV"
        />
        <div>
          <h2>CampusEV</h2>
          <p>Driver Panel</p>
        </div>
      </div>

      <nav className="driver-nav" aria-label="Driver navigation">
        <NavLink
          to="/driver-dashboard"
          end
          className={linkClass}
        >
          <span>▣</span> Overview
        </NavLink>

        <NavLink to="/driver-route" className={linkClass}>
          <span>🗺️</span> Route
        </NavLink>

        <NavLink to="/driver-gps" className={linkClass}>
          <span>📍</span> Turn On Driver GPS
        </NavLink>

        <NavLink to="/driver-seats" className={linkClass}>
          <span>♙</span> Update Vehicle Seats
        </NavLink>

        <NavLink to="/driver-vehicle" className={linkClass}>
          <span>⚡</span> Turn ON Vehicle
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="logout-btn"
          onClick={logout}
        >
          <span>↪</span> Logout
        </button>
      </div>
    </aside>
  );
}

export default DriverSidebar;
