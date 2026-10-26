
import { NavLink, useNavigate } from "react-router-dom";
import socket from "../socket";

function StudentSidebar() {
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

  return (
    <aside className="student-sidebar">
      <nav className="student-nav">
        <NavLink to="/dashboard" className="sidebar-link">
          🏠 Dashboard
        </NavLink>

        <NavLink to="/tracking" className="sidebar-link">
          📍 Live tracking
        </NavLink>

        <NavLink to="/routes" className="sidebar-link">
          🗺️ Routes & stops
        </NavLink>
      </nav>

      <div className="student-sidebar-bottom">
        <button
          type="button"
          className="student-logout"
          onClick={logout}
        >
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;
