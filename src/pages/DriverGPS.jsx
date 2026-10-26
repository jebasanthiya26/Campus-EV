import { useEffect, useRef, useState } from "react";
import axios from "axios";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function DriverGPS() {
  const [vehicle, setVehicle] = useState(null);
  const [location, setLocation] = useState(null);

  const [gpsStatus, setGpsStatus] =
    useState("GPS is turned off");

  const [socketStatus, setSocketStatus] =
    useState("Connecting...");

  const [error, setError] = useState("");

  const [isTracking, setIsTracking] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const watchIdRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const [demoMode, setDemoMode] = useState(false);

  const vehicleId =
    localStorage.getItem("selectedVehicleId");

  const vehicleNumber =
    localStorage.getItem("selectedVehicleNumber") ||
    "EV";

  // =====================================================
  // LOAD SELECTED VEHICLE
  // =====================================================

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) {
        setError(
          "No EV selected. Please select your vehicle first."
        );
        return;
      }

      try {
        const token =
          localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/api/vehicles/${vehicleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVehicle(response.data);
      } catch (err) {
        console.error(
          "Vehicle loading error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load selected vehicle."
        );
      }
    };

    loadVehicle();
  }, [vehicleId]);

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Login session expired. Please login again."
      );
      return;
    }

    socket.auth = {
      token,
    };

    const handleConnect = () => {
      setSocketStatus("Connected");
    };

    const handleDisconnect = () => {
      setSocketStatus("Disconnected");
    };

    const handleConnectError = (err) => {
      console.error(
        "Socket connection error:",
        err.message
      );

      setSocketStatus("Connection error");
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.disconnect();
    };
  }, []);

  // =====================================================
  // START PHONE GPS
  // =====================================================

  const startGPS = () => {
    setError("");

    if (!vehicleId) {
      setError(
        "Please select an EV before starting GPS."
      );
      return;
    }

    if (!navigator.geolocation) {
      setError(
        "GPS is not supported by this browser."
      );
      return;
    }

    if (isTracking) {
      return;
    }

    setGpsStatus(
      "Requesting location permission..."
    );

    const options = {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    };

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracy =
            position.coords.accuracy;

          const updatedAt =
            new Date();

          setLocation({
            latitude,
            longitude,
            accuracy,
          });

          setLastUpdated(
            updatedAt
          );

          setGpsStatus(
            "GPS Active"
          );

          setIsTracking(true);
          setDemoMode(false);
          localStorage.setItem("driverGpsActive", "true");

          // ---------------------------------------------
          // SEND GPS THROUGH SOCKET.IO
          // ---------------------------------------------

          if (socket.connected) {
            socket.emit(
              "gpsUpdate",
              {
                vehicleId,
                latitude,
                longitude,
                accuracy,
                locationName:
                  "Live GPS",
                timestamp:
                  updatedAt.toISOString(),
              }
            );
          }
        },

        (gpsError) => {
          console.error(
            "GPS Error:",
            gpsError
          );

          setIsTracking(false);

          switch (gpsError.code) {
            case 1:
              setGpsStatus(
                "Permission denied"
              );

              setError(
                "Location permission was denied. Please allow location access in your phone/browser settings."
              );
              break;

            case 2:
              setGpsStatus(
                "Location unavailable"
              );

              setError(
                "Unable to determine your location. Please turn ON GPS/location services."
              );
              break;

            case 3:
              setGpsStatus(
                "GPS timeout"
              );

              setError(
                "GPS request timed out. Please move to an open area and try again."
              );
              break;

            default:
              setGpsStatus(
                "GPS error"
              );

              setError(
                "Unable to access phone GPS."
              );
          }
        },

        options
      );

    watchIdRef.current =
      watchId;

    setIsTracking(true);
    setGpsStatus(
      "Getting phone GPS..."
    );
  };

  // Clearly labelled simulation for a classroom/demo when browser GPS is
  // unavailable (for example, a second laptop on plain HTTP over a LAN).
  const startDemoMovement = () => {
    setError("");
    if (!vehicleId) {
      setError("Select a vehicle before starting demo movement.");
      return;
    }
    if (!socket.connected) {
      setError("Live server connection is not ready. Wait for Connected and try again.");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (demoIntervalRef.current !== null) window.clearInterval(demoIntervalRef.current);
    const saved = vehicle?.currentLocation || {};
    let latitude = Number(saved.latitude);
    let longitude = Number(saved.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || latitude === 0) latitude = 12.88348;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180 || longitude === 0) longitude = 80.059531;
    const sendPosition = () => {
      // A small, visible coordinate change each second for demonstration only.
      latitude += 0.00008;
      longitude += 0.00006;
      const updatedAt = new Date();
      const nextLocation = { latitude, longitude, accuracy: 8 };
      setLocation(nextLocation);
      setLastUpdated(updatedAt);
      setGpsStatus("Demo movement active");
      setIsTracking(true);
      setDemoMode(true);
      localStorage.setItem("driverGpsActive", "true");
      socket.emit("gpsUpdate", { vehicleId, latitude, longitude, accuracy: 8, locationName: "DEMO SIMULATION", timestamp: updatedAt.toISOString() });
      setVehicle((old) => old ? { ...old, currentLocation: { ...old.currentLocation, ...nextLocation } } : old);
    };
    sendPosition();
    demoIntervalRef.current = window.setInterval(sendPosition, 2000);
  };

  // =====================================================
  // STOP PHONE GPS / DEMO MOVEMENT
  // =====================================================

  const stopGPS = () => {
    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    if (demoIntervalRef.current !== null) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsTracking(false);
    setDemoMode(false);
    localStorage.setItem("driverGpsActive", "false");
    setGpsStatus("GPS is turned off");
    setLocation(null);
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (demoIntervalRef.current !== null) {
        window.clearInterval(demoIntervalRef.current);
      }
      localStorage.setItem("driverGpsActive", "false");
    };
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCoordinate = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "--";
    }

    return value.toFixed(6);
  };

  const formatAccuracy = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "--";
    }

    return `${Math.round(value)} m`;
  };

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "--";
    }

    return new Date(
      date
    ).toLocaleTimeString();
  };

  const isConnected =
    socketStatus === "Connected";

  const gpsActive =
    (gpsStatus === "GPS Active" || gpsStatus === "Demo movement active") &&
    isTracking;

  return (
    <DriverLayout>
      <div
        style={{
          minHeight: "100%",
          padding: "24px",
          background:
            "var(--app-background, #f5f7fb)",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                background:
                  "rgba(16, 185, 129, 0.12)",
              }}
            >
              📍
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 800,
                }}
              >
                Live GPS
              </h1>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color:
                    "#64748b",
                }}
              >
                Share your phone location with
                CampusEV
              </p>
            </div>
          </div>
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "12px",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#b91c1c",
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}


        {/* =================================================
            VEHICLE CARD
        ================================================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,0.06)",
            border:
              "1px solid #e2e8f0",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >

            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  fontWeight: 700,
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.08em",
                }}
              >
                Selected Vehicle
              </div>

              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  marginTop: "5px",
                }}
              >
                🚌 {vehicleNumber}
              </div>

              <div
                style={{
                  marginTop: "7px",
                  color: "#64748b",
                }}
              >
                Line:{" "}
                <strong
                  style={{
                    color: "#0f172a",
                  }}
                >
                  {vehicle?.currentRoute ||
                    "Line not selected"}
                </strong>
              </div>
            </div>


            {/* SOCKET STATUS */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding:
                  "9px 14px",
                borderRadius:
                  "999px",
                background:
                  isConnected
                    ? "#ecfdf5"
                    : "#fef2f2",
                color:
                  isConnected
                    ? "#047857"
                    : "#b91c1c",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius:
                    "50%",
                  background:
                    isConnected
                      ? "#10b981"
                      : "#ef4444",
                }}
              />

              {socketStatus}
            </div>

          </div>
        </div>


        {/* =================================================
            GPS STATUS
        ================================================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "20px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,0.06)",
            border:
              "1px solid #e2e8f0",
          }}
        >

          <div
            style={{
              textAlign: "center",
              marginBottom: "25px",
            }}
          >

            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                margin:
                  "0 auto 18px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: "40px",
                background:
                  gpsActive
                    ? "#dcfce7"
                    : "#f1f5f9",
                boxShadow:
                  gpsActive
                    ? "0 0 0 10px rgba(34,197,94,0.08)"
                    : "none",
              }}
            >
              {gpsActive
                ? "📡"
                : "📍"}
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "23px",
              }}
            >
              {gpsStatus}
            </h2>

            <p
              style={{
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              {demoMode
                ? "DEMO SIMULATION: coordinates change every 2 seconds. This is not physical GPS."
                : gpsActive
                ? "Your phone is sharing live location with CampusEV."
                : "Turn on phone GPS or use demo movement to test the student map."}
            </p>

          </div>


          {/* GPS BUTTONS */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >

            <button
              onClick={startGPS}
              disabled={isTracking}
              style={{
                border: "none",
                borderRadius: "12px",
                padding:
                  "14px 28px",
                fontSize: "15px",
                fontWeight: 800,
                cursor:
                  isTracking
                    ? "not-allowed"
                    : "pointer",
                background:
                  isTracking
                    ? "#cbd5e1"
                    : "#10b981",
                color: "#ffffff",
                boxShadow:
                  isTracking
                    ? "none"
                    : "0 8px 18px rgba(16,185,129,0.25)",
              }}
            >
              📡{" "}
              {isTracking
                ? "GPS ACTIVE"
                : "TURN ON GPS"}
            </button>


            <button
              type="button"
              onClick={startDemoMovement}
              disabled={isTracking || !isConnected}
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
                padding: "14px 22px",
                fontSize: "15px",
                fontWeight: 800,
                cursor: isTracking || !isConnected ? "not-allowed" : "pointer",
                background: isTracking || !isConnected ? "#f1f5f9" : "#eff6ff",
                color: isTracking || !isConnected ? "#94a3b8" : "#1d4ed8",
              }}
            >
              ▶ Start demo movement
            </button>

            <button
              onClick={stopGPS}
              disabled={
                !isTracking
              }
              style={{
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding:
                  "14px 28px",
                fontSize: "15px",
                fontWeight: 800,
                cursor:
                  !isTracking
                    ? "not-allowed"
                    : "pointer",
                background:
                  !isTracking
                    ? "#f1f5f9"
                    : "#ffffff",
                color:
                  !isTracking
                    ? "#94a3b8"
                    : "#dc2626",
              }}
            >
              ⏹ STOP GPS
            </button>

          </div>

        </div>


        {/* =================================================
            LIVE LOCATION DATA
        ================================================= */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow:
              "0 8px 30px rgba(15,23,42,0.06)",
            border:
              "1px solid #e2e8f0",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                Live Location
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Phone GPS information
              </p>
            </div>

            <div
              style={{
                padding:
                  "7px 12px",
                borderRadius:
                  "999px",
                background:
                  gpsActive
                    ? "#dcfce7"
                    : "#f1f5f9",
                color:
                  gpsActive
                    ? "#15803d"
                    : "#64748b",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {gpsActive
                ? "LIVE"
                : "OFFLINE"}
            </div>

          </div>


          {/* DATA GRID */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
          >

            <LocationBox
              label="Latitude"
              value={
                formatCoordinate(
                  location?.latitude
                )
              }
              icon="↕️"
            />

            <LocationBox
              label="Longitude"
              value={
                formatCoordinate(
                  location?.longitude
                )
              }
              icon="↔️"
            />

            <LocationBox
              label="Accuracy"
              value={
                formatAccuracy(
                  location?.accuracy
                )
              }
              icon="🎯"
            />

            <LocationBox
              label="Last Updated"
              value={
                formatTime(
                  lastUpdated
                )
              }
              icon="🕐"
            />

          </div>


          {/* INFORMATION */}

          <div
            style={{
              marginTop: "20px",
              padding: "14px 16px",
              borderRadius: "12px",
              background:
                "#f8fafc",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <strong
              style={{
                color: "#334155",
              }}
            >
              Privacy:
            </strong>{" "}
            Driver GPS is used only for the
            CampusEV vehicle tracking system.
            Passenger location will remain on
            the passenger's device and will not
            be broadcast to other users.
          </div>

        </div>

      </div>
    </DriverLayout>
  );
}


// =======================================================
// LOCATION BOX COMPONENT
// =======================================================

function LocationBox({
  label,
  value,
  icon,
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "14px",
        background: "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#64748b",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        <span>{icon}</span>
        {label}
      </div>

      <div
        style={{
          marginTop: "9px",
          fontSize: "18px",
          fontWeight: 800,
          color: "#0f172a",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>

    </div>
  );
}

export default DriverGPS;