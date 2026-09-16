import StudentLayout from "../components/StudentLayout";

function Seats() {
  const seats = [
    "Available",
    "Available",
    "Booked",
    "Available",
    "Available",
    "Booked",
    "Available",
    "Available",
    "Available",
    "Booked",
    "Available",
    "Available",
    "Available",
  ];

  const availableSeats = seats.filter(
    (seat) => seat === "Available"
  ).length;

  return (
    <StudentLayout>
      <h1 className="page-heading">
        Seat Availability
      </h1>

      <div className="page-card">
        <div className="seat-summary">
          Available Seats: {availableSeats} / 13
        </div>

        <div className="seat-grid">
          {seats.map((seat, index) => (
            <div
              key={index}
              className={
                seat === "Booked"
                  ? "seat booked"
                  : "seat"
              }
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Seats;