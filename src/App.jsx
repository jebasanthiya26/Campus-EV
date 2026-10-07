import { Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";

import StudentDashboard from "./pages/StudentDashboard";
import Tracking from "./pages/Tracking";
import RoutesPage from "./pages/Routes";
import Seats from "./pages/Seats";
import Profile from "./pages/Profile";

import DriverVehicleSelect from "./pages/DriverVehicleSelect";
import DriverDashboard from "./pages/DriverDashboard";
import DriverGPS from "./pages/DriverGPS";
import DriverSeats from "./pages/DriverSeats";
import DriverVehicle from "./pages/DriverVehicle";
import ManagementDashboard from "./pages/ManagementDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/seats" element={<Seats />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/driver-select" element={<DriverVehicleSelect />} />
      <Route path="/driver-dashboard" element={<DriverDashboard />} />
      <Route path="/driver-gps" element={<DriverGPS />} />
      <Route path="/driver-seats" element={<DriverSeats />} />
      <Route path="/driver-vehicle" element={<DriverVehicle />} />
      <Route
  path="/management"
  element={<ManagementDashboard />}
/>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;