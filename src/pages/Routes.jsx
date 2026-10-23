import StudentLayout from "../components/StudentLayout";

function RoutesPage() {
  return (
    <StudentLayout>
      <h1 className="page-heading">
        Available Routes
      </h1>

      <div className="routes-grid">

        {/* GREEN LINE */}
        <div className="route-card green-route">
          <div className="route-header">
            <span className="route-dot green-dot"></span>
            <span>Green Line</span>
          </div>

          <ol className="route-stop-list">
            <li>Hostel Mess</li>
            <li>Department of MBA</li>
            <li>SBI ATM</li>
            <li>Dean Office</li>
            <li>Soil Mechanics</li>
            <li>Department of Mechanical</li>
          </ol>
        </div>

        {/* BLUE LINE */}
        <div className="route-card blue-route">
          <div className="route-header">
            <span className="route-dot blue-dot"></span>
            <span>Blue Line</span>
          </div>

          <ol className="route-stop-list">
            <li>Main Gate</li>
            <li>Dean Office</li>
            <li>HighVoltage</li>
            <li>NCC Office</li>
            <li>Department of Printing Tech</li>
            <li>International Hostel</li>
            <li>Mess Gate</li>
            <li>Kottupuram Gate</li>
          </ol>
        </div>

      </div>
    </StudentLayout>
  );
}

export default RoutesPage;
