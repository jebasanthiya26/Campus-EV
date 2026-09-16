import StudentLayout from "../components/StudentLayout";

function StudentDashboard() {
  return (
    <StudentLayout>
      <h1 className="page-heading">
        Dashboard
      </h1>

      <p className="welcome-text">
        Welcome to Campus EV Tracking System 👋
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            🚌 Vehicle Status
          </div>

          <div className="dashboard-card-value">
            Running
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            📍 Current Stop
          </div>

          <div className="dashboard-card-value">
            Library
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            💺 Available Seats
          </div>

          <div className="dashboard-card-value">
            8 / 13
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            ⏱ ETA
          </div>

          <div className="dashboard-card-value">
            3 Minutes
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            🛣 Next Stop
          </div>

          <div className="dashboard-card-value">
            Hostel
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            🔋 Battery
          </div>

          <div className="dashboard-card-value">
            82%
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default StudentDashboard;