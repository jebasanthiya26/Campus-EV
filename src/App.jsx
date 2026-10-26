
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student and Faculty pages
import StudentDashboard from "./pages/StudentDashboard";
import Tracking from "./pages/Tracking";
import RoutesPage from "./pages/Routes";
import Seats from "./pages/Seats";

// Driver pages
import DriverVehicleSelect from "./pages/DriverVehicleSelect";
import DriverDashboard from "./pages/DriverDashboard";
import DriverRoute from "./pages/DriverRoute";
import DriverGPS from "./pages/DriverGPS";
import DriverSeats from "./pages/DriverSeats";
import DriverVehicle from "./pages/DriverVehicle";

// Management page
import ManagementDashboard from "./pages/ManagementDashboard";

function RequireRole({ roles, children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(role)) {
    if (role === "driver") {
      return <Navigate to="/driver-select" replace />;
    }

    if (role === "management") {
      return <Navigate to="/management" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const studentRoles = ["student", "faculty"];
const driverRoles = ["driver"];
const managementRoles = ["management"];

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student and Faculty */}
      <Route
        path="/dashboard"
        element={
          <RequireRole roles={studentRoles}>
            <StudentDashboard />
          </RequireRole>
        }
      />

      <Route
        path="/tracking"
        element={
          <RequireRole roles={studentRoles}>
            <Tracking />
          </RequireRole>
        }
      />

      <Route
        path="/routes"
        element={
          <RequireRole roles={studentRoles}>
            <RoutesPage />
          </RequireRole>
        }
      />

      <Route
        path="/seats"
        element={
          <RequireRole roles={studentRoles}>
            <Seats />
          </RequireRole>
        }
      />

      {/* Driver: Step 1 - Select vehicle */}
      <Route
        path="/driver-select"
        element={
          <RequireRole roles={driverRoles}>
            <DriverVehicleSelect />
          </RequireRole>
        }
      />

      {/* Driver: Step 2 - Overview */}
      <Route
        path="/driver-dashboard"
        element={
          <RequireRole roles={driverRoles}>
            <DriverDashboard />
          </RequireRole>
        }
      />

      {/* Driver: Step 3 - Route selection */}
      <Route
        path="/driver-route"
        element={
          <RequireRole roles={driverRoles}>
            <DriverRoute />
          </RequireRole>
        }
      />

      {/* Driver: Step 4 - GPS tracking */}
      <Route
        path="/driver-gps"
        element={
          <RequireRole roles={driverRoles}>
            <DriverGPS />
          </RequireRole>
        }
      />

      {/* Driver: Step 5 - Seat management */}
      <Route
        path="/driver-seats"
        element={
          <RequireRole roles={driverRoles}>
            <DriverSeats />
          </RequireRole>
        }
      />

      {/* Driver: Step 6 - Vehicle power/status */}
      <Route
        path="/driver-vehicle"
        element={
          <RequireRole roles={driverRoles}>
            <DriverVehicle />
          </RequireRole>
        }
      />

      {/* Management */}
      <Route
        path="/management"
        element={
          <RequireRole roles={managementRoles}>
            <ManagementDashboard />
          </RequireRole>
        }
      />

      {/* Unknown URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
