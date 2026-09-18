import { useNavigate } from "react-router-dom";

function DriverVehicleSelect() {
  const navigate = useNavigate();

  const selectVehicle = (vehicleId, vehicleNumber) => {
    localStorage.setItem(
      "selectedVehicleId",
      vehicleId
    );

    localStorage.setItem(
      "selectedVehicleNumber",
      vehicleNumber
    );

    navigate("/driver-dashboard");
  };

  return (
    <div className="driver-select-page">
      <div className="driver-select-container">

        <h1>🚌 Campus EV Driver</h1>

        <p className="driver-subtitle">
          Select the vehicle assigned to you
        </p>

        {/* CAMPUS EV-01 */}
        <div className="vehicle-selection-card">
          <div>
            <h3>Campus EV-01</h3>

            <span className="available">
              🟢 Available
            </span>
          </div>

          <button
            className="select-vehicle-btn"
            onClick={() =>
              selectVehicle(
                "6aaaa559c4517d6bb53974bf",
                "Campus EV-01"
              )
            }
          >
            Select Vehicle
          </button>
        </div>


        {/* CAMPUS EV-02 */}
        <div className="vehicle-selection-card">
          <div>
            <h3>Campus EV-02</h3>

            <span className="available">
              🟢 Available
            </span>
          </div>

          <button
            className="select-vehicle-btn"
            onClick={() =>
              selectVehicle(
                "6aaaa569c4517d6bb53974c1",
                "Campus EV-02"
              )
            }
          >
            Select Vehicle
          </button>
        </div>


        {/* CAMPUS EV-03 */}
        <div className="vehicle-selection-card">
          <div>
            <h3>Campus EV-03</h3>

            <span className="unavailable">
              🔴 In Use
            </span>
          </div>

          <button
            className="select-vehicle-btn"
            disabled
          >
            Unavailable
          </button>
        </div>

      </div>
    </div>
  );
}

export default DriverVehicleSelect;