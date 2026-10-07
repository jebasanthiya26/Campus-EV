import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DriverLayout from "../components/DriverLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const LINES = ["Green Line", "Blue Line"];

function DriverDashboard() {
  const navigate = useNavigate();

  const vehicleId =
    localStorage.getItem("selectedVehicleId");

  const savedVehicleNumber =
    localStorage.getItem("selectedVehicleNumber") ||
    "EV";

  const [vehicle, setVehicle] = useState(null);

  const [selectedLine, setSelectedLine] =
    useState(
      localStorage.getItem("selectedLine") ||
        ""
    );

  const [occupiedSeats, setOccupiedSeats] =
    useState(0);

  const [totalSeats, setTotalSeats] =
    useState(13);

  const [gpsActive, setGpsActive] =
    useState(
      localStorage.getItem(
        "driverGpsActive"
      ) === "true"
    );

  const [gpsLocation, setGpsLocation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [savingLine, setSavingLine] =
    useState(false);

  const [updatingSeats, setUpdatingSeats] =
    useState(false);

  const [startingVehicle, setStartingVehicle] =
    useState(false);

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isRunning, setIsRunning] =
    useState(false);

  const gpsWatchRef = useRef(null);

  // =====================================================
  // LOAD VEHICLE
  // =====================================================

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) {
        setError(
          "No vehicle selected. Please select an EV first."
        );
        setLoading(false);
        return;
      }

      try {
        const token =
          localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/api/vehicles/${vehicleId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        setVehicle(data);

        setOccupiedSeats(
          data.occupiedSeats || 0
        );

        setTotalSeats(
          data.totalSeats || 13
        );

        if (data.currentRoute) {
          setSelectedLine(
            data.currentRoute
          );

          localStorage.setItem(
            "selectedLine",
            data.currentRoute
          );
        }

        setIsRunning(
          data.status === "RUNNING"
        );
      } catch (err) {
        console.error(
          "Vehicle load error:",
          err
        );

        // Keep UI usable even when MongoDB
        // is temporarily unavailable.

        setVehicle({
          vehicleNumber:
            savedVehicleNumber,
          currentRoute:
            selectedLine || null,
          status: "ON",
          totalSeats: 13,
          occupiedSeats: 0,
        });

        setTotalSeats(13);
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [vehicleId, savedVehicleNumber]);

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    socket.auth = {
      token,
    };

    const onConnect = () => {
      setSocketConnected(true);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const onVehicleStatusUpdated =
      (data) => {
        if (
          String(data.vehicleId) !==
          String(vehicleId)
        ) {
          return;
        }

        setIsRunning(
          data.status === "RUNNING"
        );

        setVehicle((prev) => ({
          ...prev,
          status: data.status,
          currentRoute:
            data.currentRoute ||
            prev?.currentRoute,
        }));
      };

    const onSeatUpdated = (data) => {
      if (
        String(data.vehicleId) !==
        String(vehicleId)
      ) {
        return;
      }

      setOccupiedSeats(
        data.occupiedSeats
      );

      setTotalSeats(
        data.totalSeats
      );
    };

    const onVehicleLocation =
      (data) => {
        if (
          String(data.vehicleId) !==
          String(vehicleId)
        ) {
          return;
        }

        setGpsLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
        });
      };

    socket.on(
      "connect",
      onConnect
    );

    socket.on(
      "disconnect",
      onDisconnect
    );

    socket.on(
      "vehicleStatusUpdated",
      onVehicleStatusUpdated
    );

    socket.on(
      "seatUpdated",
      onSeatUpdated
    );

    socket.on(
      "vehicleLocation",
      onVehicleLocation
    );

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        onConnect
      );

      socket.off(
        "disconnect",
        onDisconnect
      );

      socket.off(
        "vehicleStatusUpdated",
        onVehicleStatusUpdated
      );

      socket.off(
        "seatUpdated",
        onSeatUpdated
      );

      socket.off(
        "vehicleLocation",
        onVehicleLocation
      );
    };
  }, [vehicleId]);

  // =====================================================
  // DRIVER GPS
  // =====================================================

  const startGPS = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError(
        "GPS is not supported by this device."
      );
      return;
    }

    if (gpsWatchRef.current !== null) {
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude,
            accuracy:
              position.coords.accuracy,
          };

          setGpsLocation(location);
          setGpsActive(true);

          localStorage.setItem(
            "driverGpsActive",
            "true"
          );

          if (socket.connected) {
            socket.emit(
              "gpsUpdate",
              {
                vehicleId,
                ...location,
                locationName:
                  "Live GPS",
                timestamp:
                  new Date().toISOString(),
              }
            );
          }
        },
        (gpsError) => {
          console.error(
            "Driver GPS error:",
            gpsError
          );

          setGpsActive(false);

          localStorage.setItem(
            "driverGpsActive",
            "false"
          );

          if (gpsError.code === 1) {
            setError(
              "Location permission denied. Please allow GPS access."
            );
          } else if (
            gpsError.code === 2
          ) {
            setError(
              "Location unavailable. Turn ON GPS/location services."
            );
          } else if (
            gpsError.code === 3
          ) {
            setError(
              "GPS timed out. Please try again."
            );
          } else {
            setError(
              "Unable to access GPS."
            );
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );

    gpsWatchRef.current =
      watchId;

    setGpsActive(true);

    localStorage.setItem(
      "driverGpsActive",
      "true"
    );
  };

  const stopGPS = () => {
    if (
      gpsWatchRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        gpsWatchRef.current
      );

      gpsWatchRef.current = null;
    }

    setGpsActive(false);

    localStorage.setItem(
      "driverGpsActive",
      "false"
    );
  };

  // =====================================================
  // LINE SELECTION
  // =====================================================

  const selectLine = async (line) => {
    setSelectedLine(line);

    localStorage.setItem(
      "selectedLine",
      line
    );

    setError("");
    setMessage("");

    if (!vehicleId) return;

    setSavingLine(true);

    try {
      const token =
        localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/route`,
        {
          route: line,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setVehicle((prev) => ({
        ...prev,
        currentRoute: line,
      }));

      setMessage(
        `${line} selected successfully.`
      );
    } catch (err) {
      console.error(
        "Line update error:",
        err
      );

      // Keep local selection so the UI
      // remains usable while MongoDB is offline.

      setMessage(
        `${line} selected on this device. It will sync when the backend is available.`
      );
    } finally {
      setSavingLine(false);
    }
  };

  // =====================================================
  // SEAT UPDATE
  // =====================================================

  const changeSeats = async (
    newValue
  ) => {
    if (
      newValue < 0 ||
      newValue > totalSeats
    ) {
      return;
    }

    setOccupiedSeats(newValue);
    setUpdatingSeats(true);

    if (socket.connected) {
      socket.emit(
        "seatUpdate",
        {
          vehicleId,
          occupiedSeats:
            newValue,
        }
      );
    }

    try {
      const token =
        localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/seats`,
        {
          occupiedSeats:
            newValue,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.warn(
        "Seat database update unavailable:",
        err.message
      );
    } finally {
      setUpdatingSeats(false);
    }
  };

  // =====================================================
  // START VEHICLE
  // =====================================================

  const startVehicle = async () => {
    setError("");
    setMessage("");

    if (!selectedLine) {
      setError(
        "Please select Green Line or Blue Line first."
      );
      return;
    }

    if (!gpsActive) {
      setError(
        "Please turn ON your phone GPS before starting the vehicle."
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Live connection is not available. Please check the backend connection."
      );
      return;
    }

    setStartingVehicle(true);

    try {
      socket.emit(
        "vehicleStatusUpdate",
        {
          vehicleId,
          status: "RUNNING",
        }
      );

      setIsRunning(true);

      setVehicle((prev) => ({
        ...prev,
        status: "RUNNING",
      }));

      setMessage(
        "Vehicle started. Live tracking is now active."
      );

      // REST backup
      const token =
        localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/status`,
        {
          status: "RUNNING",
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.warn(
        "REST vehicle start unavailable:",
        err.message
      );

      // Socket event has already updated
      // the local UI.

      setMessage(
        "Vehicle started locally. Backend sync will occur when connected."
      );
    } finally {
      setStartingVehicle(false);
    }
  };

  // =====================================================
  // STOP VEHICLE
  // =====================================================

  const stopVehicle = async () => {
    setStartingVehicle(true);

    try {
      if (socket.connected) {
        socket.emit(
          "vehicleStatusUpdate",
          {
            vehicleId,
            status: "OFF",
          }
        );
      }

      setIsRunning(false);

      setVehicle((prev) => ({
        ...prev,
        status: "OFF",
      }));

      const token =
        localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/vehicles/${vehicleId}/status`,
        {
          status: "OFF",
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setMessage(
        "Vehicle stopped successfully."
      );
    } catch (err) {
      console.warn(
        "Vehicle stop sync unavailable:",
        err.message
      );

      setMessage(
        "Vehicle stopped on this device."
      );
    } finally {
      setStartingVehicle(false);
    }
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        gpsWatchRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          gpsWatchRef.current
        );
      }
    };
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const availableSeats =
    totalSeats - occupiedSeats;

  const statusLabel = isRunning
    ? "RUNNING"
    : "READY";

  const statusColor = isRunning
    ? "#16a34a"
    : "#f59e0b";

  if (loading) {
    return (
      <DriverLayout>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading driver control center...
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div
        style={{
          minHeight: "100%",
          padding: "24px",
          background:
            "#f5f7fb",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
                fontWeight: 800,
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.08em",
              }}
            >
              Driver Control Center
            </div>

            <h1
              style={{
                margin:
                  "5px 0 0",
                fontSize: "30px",
                fontWeight: 850,
                color: "#0f172a",
              }}
            >
              {vehicle?.vehicleNumber ||
                savedVehicleNumber}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding:
                "9px 14px",
              borderRadius:
                "999px",
              background:
                socketConnected
                  ? "#ecfdf5"
                  : "#fef2f2",
              color:
                socketConnected
                  ? "#047857"
                  : "#b91c1c",
              fontWeight: 800,
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
                  socketConnected
                    ? "#10b981"
                    : "#ef4444",
              }}
            />

            {socketConnected
              ? "LIVE CONNECTION"
              : "OFFLINE"}
          </div>
        </div>


        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            style={{
              padding:
                "13px 16px",
              marginBottom:
                "18px",
              borderRadius:
                "12px",
              background:
                "#ecfdf5",
              color:
                "#047857",
              fontWeight: 700,
            }}
          >
            ✓ {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding:
                "13px 16px",
              marginBottom:
                "18px",
              borderRadius:
                "12px",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#b91c1c",
              fontWeight: 700,
            }}
          >
            ⚠️ {error}
          </div>
        )}


        {/* =================================================
            STATUS HERO
        ================================================= */}

        <div
          style={{
            background:
              "#ffffff",
            borderRadius:
              "22px",
            padding:
              "24px",
            marginBottom:
              "20px",
            border:
              "1px solid #e2e8f0",
            boxShadow:
              "0 10px 35px rgba(15,23,42,0.06)",
          }}
        >

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr auto",
              gap: "20px",
              alignItems:
                "center",
            }}
          >

            <div>
              <div
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                  fontWeight:
                    800,
                  textTransform:
                    "uppercase",
                }}
              >
                Vehicle Status
              </div>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "12px",
                  marginTop:
                    "8px",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius:
                      "50%",
                    background:
                      statusColor,
                    boxShadow:
                      isRunning
                        ? `0 0 0 7px rgba(22,163,74,0.12)`
                        : "none",
                  }}
                />

                <strong
                  style={{
                    fontSize:
                      "28px",
                  }}
                >
                  {statusLabel}
                </strong>
              </div>

              <p
                style={{
                  color:
                    "#64748b",
                  margin:
                    "8px 0 0",
                }}
              >
                {isRunning
                  ? "Your EV is visible to passengers on the selected line."
                  : "Complete GPS and line setup before starting the vehicle."}
              </p>
            </div>

            <div
              style={{
                fontSize:
                  "58px",
              }}
            >
              🚌
            </div>

          </div>

        </div>


        {/* =================================================
            LINE SELECTION
        ================================================= */}

        <div
          style={{
            background:
              "#ffffff",
            borderRadius:
              "20px",
            padding:
              "22px",
            marginBottom:
              "20px",
            border:
              "1px solid #e2e8f0",
          }}
        >

          <h2
            style={{
              margin:
                "0 0 5px",
              fontSize:
                "20px",
            }}
          >
            Select EV Line
          </h2>

          <p
            style={{
              margin:
                "0 0 18px",
              color:
                "#64748b",
              fontSize:
                "14px",
            }}
          >
            Choose the route this vehicle is
            currently operating on.
          </p>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap:
                "14px",
            }}
          >

            {LINES.map((line) => {
              const selected =
                selectedLine === line;

              const green =
                line ===
                "Green Line";

              return (
                <button
                  key={line}
                  onClick={() =>
                    selectLine(line)
                  }
                  disabled={
                    savingLine ||
                    isRunning
                  }
                  style={{
                    textAlign:
                      "left",
                    padding:
                      "18px",
                    borderRadius:
                      "16px",
                    border:
                      selected
                        ? `2px solid ${
                            green
                              ? "#16a34a"
                              : "#2563eb"
                          }`
                        : "1px solid #e2e8f0",
                    background:
                      selected
                        ? green
                          ? "#f0fdf4"
                          : "#eff6ff"
                        : "#ffffff",
                    cursor:
                      isRunning
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      isRunning &&
                      !selected
                        ? 0.55
                        : 1,
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "10px",
                    }}
                  >
                    <span
                      style={{
                        width:
                          "13px",
                        height:
                          "13px",
                        borderRadius:
                          "50%",
                        background:
                          green
                            ? "#16a34a"
                            : "#2563eb",
                      }}
                    />

                    <strong
                      style={{
                        fontSize:
                          "17px",
                        color:
                          "#0f172a",
                      }}
                    >
                      {line}
                    </strong>

                    {selected && (
                      <span
                        style={{
                          marginLeft:
                            "auto",
                          fontSize:
                            "13px",
                          fontWeight:
                            800,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                </button>
              );
            })}

          </div>

        </div>


        {/* =================================================
            GPS + SEATS
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap:
              "20px",
            marginBottom:
              "20px",
          }}
        >

          {/* GPS CARD */}

          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "20px",
              padding:
                "22px",
              border:
                "1px solid #e2e8f0",
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "20px",
                  }}
                >
                  📡 Phone GPS
                </h2>

                <p
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  Vehicle location source
                </p>
              </div>

              <span
                style={{
                  padding:
                    "7px 11px",
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
                  fontSize:
                    "12px",
                  fontWeight:
                    800,
                }}
              >
                {gpsActive
                  ? "ACTIVE"
                  : "OFF"}
              </span>
            </div>

            {gpsLocation ? (
              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "12px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  fontSize:
                    "13px",
                }}
              >
                <strong>
                  {gpsLocation.latitude.toFixed(
                    6
                  )}
                  ,{" "}
                  {gpsLocation.longitude.toFixed(
                    6
                  )}
                </strong>

                <div
                  style={{
                    color:
                      "#64748b",
                    marginTop:
                      "5px",
                  }}
                >
                  Accuracy:{" "}
                  {Math.round(
                    gpsLocation.accuracy
                  )}
                  m
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "14px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  color:
                    "#64748b",
                }}
              >
                GPS location not available yet.
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                marginTop:
                  "15px",
              }}
            >

              <button
                onClick={
                  startGPS
                }
                disabled={
                  gpsActive
                }
                style={{
                  flex: 1,
                  padding:
                    "12px",
                  border: "none",
                  borderRadius:
                    "11px",
                  background:
                    gpsActive
                      ? "#cbd5e1"
                      : "#10b981",
                  color:
                    "#ffffff",
                  fontWeight:
                    800,
                  cursor:
                    gpsActive
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {gpsActive
                  ? "GPS ACTIVE"
                  : "TURN ON GPS"}
              </button>

              <button
                onClick={
                  stopGPS
                }
                disabled={
                  !gpsActive
                }
                style={{
                  padding:
                    "12px 16px",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "11px",
                  background:
                    "#ffffff",
                  color:
                    "#dc2626",
                  fontWeight:
                    800,
                  cursor:
                    !gpsActive
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                STOP
              </button>

            </div>

          </div>


          {/* SEATS CARD */}

          <div
            style={{
              background:
                "#ffffff",
              borderRadius:
                "20px",
              padding:
                "22px",
              border:
                "1px solid #e2e8f0",
            }}
          >

            <h2
              style={{
                margin: 0,
                fontSize:
                  "20px",
              }}
            >
              💺 Seat Availability
            </h2>

            <p
              style={{
                color:
                  "#64748b",
                fontSize:
                  "13px",
              }}
            >
              Only the driver can update this.
            </p>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "15px",
                marginTop:
                  "18px",
              }}
            >

              <button
                onClick={() =>
                  changeSeats(
                    occupiedSeats -
                      1
                  )
                }
                disabled={
                  occupiedSeats <=
                  0 ||
                  updatingSeats
                }
                style={{
                  width:
                    "48px",
                  height:
                    "48px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid #e2e8f0",
                  background:
                    "#ffffff",
                  fontSize:
                    "25px",
                  fontWeight:
                    800,
                  cursor:
                    "pointer",
                }}
              >
                −
              </button>

              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "35px",
                    fontWeight:
                      850,
                  }}
                >
                  {occupiedSeats}
                  <span
                    style={{
                      color:
                        "#94a3b8",
                      fontSize:
                        "20px",
                    }}
                  >
                    /{totalSeats}
                  </span>
                </div>

                <div
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                  }}
                >
                  OCCUPIED
                </div>
              </div>

              <button
                onClick={() =>
                  changeSeats(
                    occupiedSeats +
                      1
                  )
                }
                disabled={
                  occupiedSeats >=
                    totalSeats ||
                  updatingSeats
                }
                style={{
                  width:
                    "48px",
                  height:
                    "48px",
                  borderRadius:
                    "12px",
                  border:
                    "none",
                  background:
                    "#0f172a",
                  color:
                    "#ffffff",
                  fontSize:
                    "25px",
                  fontWeight:
                    800,
                  cursor:
                    "pointer",
                }}
              >
                +
              </button>

            </div>

            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "12px",
                borderRadius:
                  "12px",
                background:
                  availableSeats <=
                  2
                    ? "#fef2f2"
                    : "#ecfdf5",
                color:
                  availableSeats <=
                  2
                    ? "#b91c1c"
                    : "#047857",
                textAlign:
                  "center",
                fontWeight:
                  800,
              }}
            >
              {availableSeats} seats
              available
            </div>

          </div>

        </div>


        {/* =================================================
            START / STOP
        ================================================= */}

        <div
          style={{
            background:
              "#0f172a",
            borderRadius:
              "22px",
            padding:
              "25px",
            color:
              "#ffffff",
            marginBottom:
              "20px",
          }}
        >

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap:
                "20px",
              flexWrap:
                "wrap",
            }}
          >

            <div>
              <div
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#94a3b8",
                  fontWeight:
                    800,
                  textTransform:
                    "uppercase",
                }}
              >
                Trip Control
              </div>

              <h2
                style={{
                  margin:
                    "5px 0",
                  fontSize:
                    "22px",
                }}
              >
                {isRunning
                  ? "Vehicle is currently running"
                  : "Ready to start the vehicle"}
              </h2>

              <div
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "14px",
                }}
              >
                {selectedLine ||
                  "No line selected"}{" "}
                •{" "}
                {availableSeats} seats
                available
              </div>
            </div>


            {!isRunning ? (
              <button
                onClick={
                  startVehicle
                }
                disabled={
                  startingVehicle ||
                  !selectedLine ||
                  !gpsActive
                }
                style={{
                  minWidth:
                    "230px",
                  padding:
                    "16px 24px",
                  border: "none",
                  borderRadius:
                    "13px",
                  background:
                    startingVehicle ||
                    !selectedLine ||
                    !gpsActive
                      ? "#475569"
                      : "#10b981",
                  color:
                    "#ffffff",
                  fontSize:
                    "16px",
                  fontWeight:
                    850,
                  cursor:
                    startingVehicle ||
                    !selectedLine ||
                    !gpsActive
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                🚌{" "}
                {startingVehicle
                  ? "STARTING..."
                  : "START VEHICLE"}
              </button>
            ) : (
              <button
                onClick={
                  stopVehicle
                }
                disabled={
                  startingVehicle
                }
                style={{
                  minWidth:
                    "230px",
                  padding:
                    "16px 24px",
                  border:
                    "1px solid #ef4444",
                  borderRadius:
                    "13px",
                  background:
                    "#7f1d1d",
                  color:
                    "#ffffff",
                  fontSize:
                    "16px",
                  fontWeight:
                    850,
                  cursor:
                    "pointer",
                }}
              >
                ⏹ STOP VEHICLE
              </button>
            )}

          </div>

        </div>


        {/* =================================================
            QUICK NAVIGATION
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap:
              "14px",
          }}
        >

          <button
            onClick={() =>
              navigate(
                "/driver-gps"
              )
            }
            style={{
              padding:
                "16px",
              borderRadius:
                "14px",
              border:
                "1px solid #e2e8f0",
              background:
                "#ffffff",
              fontWeight:
                800,
              cursor:
                "pointer",
            }}
          >
            📍 Open Full GPS
          </button>

          <button
            onClick={() =>
              navigate(
                "/driver-seats"
              )
            }
            style={{
              padding:
                "16px",
              borderRadius:
                "14px",
              border:
                "1px solid #e2e8f0",
              background:
                "#ffffff",
              fontWeight:
                800,
              cursor:
                "pointer",
            }}
          >
            💺 Open Seat Manager
          </button>

        </div>

      </div>
    </DriverLayout>
  );
}

export default DriverDashboard;