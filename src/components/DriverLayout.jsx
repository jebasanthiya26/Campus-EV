import DriverSidebar from "./DriverSidebar";

function DriverLayout({ children }) {
  return (
    <div className="driver-layout">
      <DriverSidebar />

      <main className="driver-content">
        {children}
      </main>
    </div>
  );
}

export default DriverLayout;