import StudentLayout from "../components/StudentLayout";

function RoutesPage() {
  return (
    <StudentLayout>
      <h1 className="page-heading">
        Available Routes
      </h1>

      <div className="page-card">
        <div className="route-box">
          <div className="route-name">
            Blue Line
          </div>

          <ol className="stop-list">
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

        <div className="route-box">
          <div className="route-name">
            Green Line
          </div>

          <ol className="stop-list">
            <li>Hostel Mess</li>
            <li>Department of MBA</li>
            <li>SBI ATM</li>
            <li>Dean Office</li>
            <li>Soil Mechanics</li>
            <li>Department of Mechanical</li>
          </ol>
        </div>
      </div>
    </StudentLayout>
  );
}

export default RoutesPage;