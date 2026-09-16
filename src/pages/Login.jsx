import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [userType, setUserType] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (userType === "student") {
      navigate("/dashboard");
    } else {
      navigate("/driver-select");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Campus EV Login</h1>

        <p className="login-subtitle">
          Login to access the Campus EV Tracking System
        </p>

        <div className="login-tabs">
          <button
            className={
              userType === "student"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() => setUserType("student")}
          >
            Student / Faculty
          </button>

          <button
            className={
              userType === "driver"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() => setUserType("driver")}
          >
            Driver
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <label>
            {userType === "student"
              ? "Student / Faculty ID"
              : "Driver ID"}
          </label>

          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;