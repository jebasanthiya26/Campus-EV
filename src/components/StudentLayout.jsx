
import StudentSidebar from "./StudentSidebar";

function StudentLayout({ children }) {
  return (
    <div className="student-layout">
      <header className="student-header">
        <div className="student-header-title">
          <img src="/campus-ev-logo.webp" alt="CampusEV logo" />
          <span>CampusEV</span>
        </div>
      </header>

      <div className="student-body">
        <StudentSidebar />
        <main className="student-content">{children}</main>
      </div>
    </div>
  );
}

export default StudentLayout;
