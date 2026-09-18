import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login() {
  const [userType, setUserType] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          userId: id,
          password,
          role:
  userType === "student"
    ? undefined
    : "driver",
        }
      );

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userRole", user.role);

      if (user.role === "driver") {
        navigate("/driver-select");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
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
            type="button"
            className={
              userType === "student"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() => {
              setUserType("student");
              setError("");
            }}
          >
            Student / Faculty
          </button>

          <button
            type="button"
            className={
              userType === "driver"
                ? "login-tab active"
                : "login-tab"
            }
            onClick={() => {
              setUserType("driver");
              setError("");
            }}
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
            placeholder={
              userType === "student"
                ? "Enter your ID"
                : "Enter driver ID"
            }
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="login-error">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;