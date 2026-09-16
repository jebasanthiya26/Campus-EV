import { useState } from "react";
import DriverLayout from "../components/DriverLayout";

function DriverDashboard() {
  const [route, setRoute] = useState("Blue Line");

  const routes = {
    "Blue Line": [
      "Main Gate",
      "Dean Office",
      "HighVoltage",
      "NCC Office",
      "Department of Printing Tech",
      "International Hostel",
      "Mess Gate",
      "Kottupuram Gate",
    ],

    "Green Line": [
      "Hostel Mess",
      "Department of MBA",
      "SBI ATM",
      "Dean Office",
      "Soil Mechanics",
      "Department of Mechanical",
    ],
  };

  return (
    <DriverLayout>
      <h1 className="page-heading">
        🚌 Driver Dashboard
      </h1>

      <p className="welcome-text">
        Vehicle: <strong>Campus EV-02</strong>
      </p>

      <div className="page-card">
        <h2>🗺️ Select Route</h2>

        <select
          className="route-select"
          value={route}
          onChange={(e) => setRoute(e.target.value)}
        >
          <option>Blue Line</option>
          <option>Green Line</option>
        </select>

        <div className="driver-route-list">
          <div className="route-name">
            {route}
          </div>

          {routes[route].map((stop, index) => (
            <p key={index}>
              {index + 1}. {stop}
            </p>
          ))}
        </div>
      </div>
    </DriverLayout>
  );
}

export default DriverDashboard;