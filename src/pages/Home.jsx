import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="home-page home-page-redesign">
      <div className="home-orb home-orb-one" aria-hidden="true" />
      <div className="home-orb home-orb-two" aria-hidden="true" />
      <section className="home-content home-content-redesign">
        <img className="home-logo" src="/campus-ev-logo.webp" alt="Campus EV Smart Fleet Management logo" />
        <p className="home-eyebrow">SMART, CONNECTED CAMPUS MOBILITY</p>
        <h1>Campus EV Tracking System</h1>
        <p className="home-description">
          Track campus electric vehicles in real time, check seat availability,
          and keep students, faculty, drivers and management connected.
        </p>
        <div className="home-actions">
          <button className="student-login-btn" onClick={() => navigate("/login")}>Login <span aria-hidden="true">→</span></button>
          <button className="home-register-btn" onClick={() => navigate("/register")}>Create an account</button>
        </div>
        <div className="home-role-note"><span>Student & Faculty</span><span>Driver</span><span>Management</span></div>
      </section>
    </main>
  );
}

export default Home;
