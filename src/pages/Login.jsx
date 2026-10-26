import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login() {
  const [userType, setUserType] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.userId) setId(location.state.userId);
    if (location.state?.role) setUserType(location.state.role);
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        userId: id.trim(), password, role: userType,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userRole", user.role);
      ["selectedVehicleId", "selectedVehicleNumber", "selectedLine", "driverGpsActive"].forEach((key) => localStorage.removeItem(key));
      if (user.role === "driver") navigate("/driver-select");
      else if (user.role === "management") navigate("/management");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials and make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <img src="/campus-ev-logo.webp" className="auth-logo" alt="Campus EV logo" />
        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1>Login to CampusEV</h1>
        <p className="auth-subtitle">Choose your account type to continue.</p>
        <div className="auth-role-grid" role="group" aria-label="Account type">
          {[{ value: "student", label: "Student / Faculty", icon: "🎓" }, { value: "driver", label: "Driver", icon: "🚌" }, { value: "management", label: "Management", icon: "📊" }].map((role) => (
            <button key={role.value} type="button" className={`auth-role-option ${userType === role.value ? "selected" : ""}`} onClick={() => { setUserType(role.value); setError(""); }} aria-pressed={userType === role.value}>
              <span>{role.icon}</span>{role.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="login-id">{userType === "student" ? "Student / Faculty ID" : userType === "driver" ? "Driver ID" : "Management ID"}</label>
          <input id="login-id" type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="Enter your user ID" autoComplete="username" required />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>{loading ? "Signing in…" : "Login securely"}</button>
        </form>
        <p className="auth-footer">New to CampusEV? <Link to="/register">Register an account</Link></p>
        <Link className="auth-back-link" to="/">← Back to home</Link>
      </section>
    </main>
  );
}

export default Login;
