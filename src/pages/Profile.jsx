import StudentLayout from "../components/StudentLayout";

function Profile() {
  return (
    <StudentLayout>
      <h1 className="page-heading">
        Profile
      </h1>

      <div className="page-card">
        <div className="profile-row">
          <div className="profile-label">
            Name
          </div>

          <div className="profile-value">
            Student
          </div>
        </div>

        <div className="profile-row">
          <div className="profile-label">
            Email
          </div>

          <div className="profile-value">
            student@campus.edu
          </div>
        </div>

        <div className="profile-row">
          <div className="profile-label">
            Role
          </div>

          <div className="profile-value">
            Student
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default Profile;