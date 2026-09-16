import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-content">
        <h1>🚌 Campus EV Tracking System</h1>

        <p>
          Track the live location of campus electric vehicles,
          check seat availability and estimated arrival time.
        </p>

        <button
          className="student-login-btn"
          onClick={() => navigate("/login")}
        >
          Student Login
        </button>
      </div>
    </div>
  );
}

export default Home;