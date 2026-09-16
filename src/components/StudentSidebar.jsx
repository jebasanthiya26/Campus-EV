import { NavLink, useNavigate } from "react-router-dom";

function StudentSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="student-sidebar">
      <div className="sidebar-title">Menu</div>

      <NavLink
        to="/dashboard"
        className="sidebar-link"
      >
        🏠 Dashboard
      </NavLink>

      <NavLink
        to="/tracking"
        className="sidebar-link"
      >
        📍 Tracking
      </NavLink>

      <NavLink
        to="/routes"
        className="sidebar-link"
      >
        🗺️ Routes
      </NavLink>

      <NavLink
        to="/seats"
        className="sidebar-link"
      >
        💺 Seats
      </NavLink>

      <NavLink
        to="/profile"
        className="sidebar-link"
      >
        👤 Profile
      </NavLink>

      <NavLink
        to="/"
        className="sidebar-link"
        onClick={() => navigate("/")}
      >
        🚪 Logout
      </NavLink>
    </aside>
  );
}

export default StudentSidebar;