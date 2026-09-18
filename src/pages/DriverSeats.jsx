import { useState } from "react";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

function DriverSeats() {
  const [occupiedSeats, setOccupiedSeats] = useState(5);

  const vehicleId =
    localStorage.getItem("selectedVehicleId");

  const updateSeats = (newOccupiedSeats) => {
    setOccupiedSeats(newOccupiedSeats);

    socket.emit("seatUpdate", {
      vehicleId,
      occupiedSeats: newOccupiedSeats,
      totalSeats: 13,
    });
  };

  const increase = () => {
    if (occupiedSeats < 13) {
      updateSeats(occupiedSeats + 1);
    }
  };

  const decrease = () => {
    if (occupiedSeats > 0) {
      updateSeats(occupiedSeats - 1);
    }
  };

  return (
    <DriverLayout>
      <h1 className="page-heading">
        🪑 Seat Management
      </h1>

      <div className="page-card">
        <div className="seat-summary">
          Occupied Seats: {occupiedSeats} / 13
        </div>

        <div className="seat-summary">
          Available Seats: {13 - occupiedSeats} / 13
        </div>

        <button
          className="select-vehicle-btn"
          onClick={increase}
        >
          Add Passenger
        </button>

        <button
          className="change-vehicle-btn"
          onClick={decrease}
        >
          Remove Passenger
        </button>
      </div>
    </DriverLayout>
  );
}

export default DriverSeats;