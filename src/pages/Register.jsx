import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ROLES = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "driver", label: "Driver" },
  { value: "management", label: "Management" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", userId: "", password: "", confirmPassword: "", role: "student" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: form.name.trim(), userId: form.userId.trim(), password: form.password, role: form.role,
      });
      setSuccess("Account created. You can now sign in with your new credentials.");
      setTimeout(() => navigate("/login", { state: { userId: form.userId.trim(), role: form.role === "faculty" ? "student" : form.role } }), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Check the backend connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card">
        <img src="/campus-ev-logo.webp" className="auth-logo" alt="Campus EV logo" />
        <p className="auth-eyebrow">JOIN THE CAMPUS FLEET</p>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Choose the role you will use to access CampusEV.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" name="name" value={form.name} onChange={update} autoComplete="name" placeholder="Enter your full name" required maxLength={80} />
          <label htmlFor="register-role">Register as</label>
          <select id="register-role" name="role" value={form.role} onChange={update} required>
            {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <label htmlFor="register-userid">User ID</label>
          <input id="register-userid" name="userId" value={form.userId} onChange={update} autoComplete="username" placeholder="Create or enter your campus ID" required maxLength={60} />
          <label htmlFor="register-password">Password</label>
          <input id="register-password" name="password" type="password" value={form.password} onChange={update} autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />
          <label htmlFor="register-confirm">Confirm password</label>
          <input id="register-confirm" name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Re-enter password" required minLength={8} />
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {success && <p className="auth-message auth-success" role="status">{success}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="auth-footer">Already registered? <Link to="/login">Login</Link></p>
        <p className="auth-security-note">Demo note: self-registration is enabled for all four roles. For a real deployment, restrict Driver and Management accounts to approved administrators.</p>
      </section>
    </main>
  );
}
