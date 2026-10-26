import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import StudentLayout from "../components/StudentLayout";
import socket from "../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_CENTER = [13.0105, 80.2355];

const AVERAGE_SPEED_KMH = 20;

const evIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:50%;
      background:#0f172a;
      border:4px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
    ">
      🚌
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -22],
});

const stopIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:28px;
      height:28px;
      border-radius:50%;
      background:white;
      border:4px solid #2563eb;
      box-shadow:0 3px 10px rgba(0,0,0,.2);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const youIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:24px;
      height:24px;
      border-radius:50%;
      background:#2563eb;
      border:4px solid white;
      box-shadow:0 0 0 8px rgba(37,99,235,.18);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});


// =====================================================
// MAP RECENTER
// =====================================================

function MapRecenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (
      center &&
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1])
    ) {
      map.setView(center, map.getZoom(), {
        animate: true,
      });
    }
  }, [center, map]);

  return null;
}


// =====================================================
// DISTANCE
// =====================================================

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}


// =====================================================
// VALID COORDINATE
// =====================================================

function hasCoordinates(point) {
  return (
    point &&
    Number.isFinite(Number(point.latitude)) &&
    Number.isFinite(Number(point.longitude)) &&
    Number(point.latitude) !== 0 &&
    Number(point.longitude) !== 0
  );
}


// =====================================================
// ROUTE DISTANCE
// =====================================================

function routeDistance(
  stops,
  fromIndex,
  toIndex
) {
  if (
    !stops ||
    stops.length < 2
  ) {
    return 0;
  }

  let distance = 0;

  let index = fromIndex;

  let safety = 0;

  while (
    index !== toIndex &&
    safety < stops.length + 2
  ) {
    const nextIndex =
      (index + 1) %
      stops.length;

    const current =
      stops[index];

    const next =
      stops[nextIndex];

    if (
      hasCoordinates(current) &&
      hasCoordinates(next)
    ) {
      distance += distanceKm(
        Number(current.latitude),
        Number(current.longitude),
        Number(next.latitude),
        Number(next.longitude)
      );
    }

    index = nextIndex;
    safety++;
  }

  return distance;
}


// =====================================================
// FIND NEAREST STOP
// =====================================================

function nearestStopIndex(
  vehicle,
  stops
) {
  if (
    !vehicle?.currentLocation ||
    !stops?.length
  ) {
    return -1;
  }

  if (
    !Number.isFinite(
      Number(
        vehicle.currentLocation.latitude
      )
    ) ||
    !Number.isFinite(
      Number(
        vehicle.currentLocation.longitude
      )
    )
  ) {
    return -1;
  }

  let closestIndex = -1;
  let closestDistance = Infinity;

  stops.forEach((stop, index) => {
    if (!hasCoordinates(stop)) {
      return;
    }

    const distance = distanceKm(
      Number(
        vehicle.currentLocation.latitude
      ),
      Number(
        vehicle.currentLocation.longitude
      ),
      Number(stop.latitude),
      Number(stop.longitude)
    );

    if (
      distance < closestDistance
    ) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}


// =====================================================
// ETA
// =====================================================

function calculateETA(
  vehicle,
  stops,
  selectedStop
) {
  if (
    !vehicle ||
    !selectedStop ||
    !hasCoordinates(
      selectedStop
    )
  ) {
    return null;
  }

  if (
    !vehicle.currentLocation ||
    !hasCoordinates(
      vehicle.currentLocation
    )
  ) {
    return null;
  }

  const currentIndex =
    nearestStopIndex(
      vehicle,
      stops
    );

  const targetIndex =
    stops.findIndex(
      (stop) =>
        String(stop.sequence) ===
        String(
          selectedStop.sequence
        )
    );

  if (
    currentIndex === -1 ||
    targetIndex === -1
  ) {
    return null;
  }

  const currentStop =
    stops[currentIndex];

  const distanceToCurrentStop =
    distanceKm(
      Number(
        vehicle.currentLocation.latitude
      ),
      Number(
        vehicle.currentLocation.longitude
      ),
      Number(currentStop.latitude),
      Number(currentStop.longitude)
    );

  const distanceAlongRoute =
    routeDistance(
      stops,
      currentIndex,
      targetIndex
    );

  const totalDistance =
    distanceToCurrentStop +
    distanceAlongRoute;

  const minutes =
    (totalDistance /
      AVERAGE_SPEED_KMH) *
    60;

  return {
    minutes: Math.max(
      0,
      Math.round(minutes)
    ),
    distanceKm:
      totalDistance,
  };
}


// =====================================================
// TRACKING PAGE
// =====================================================

function Tracking() {
  const [routes, setRoutes] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [selectedLine, setSelectedLine] =
    useState("");

  const [selectedStop, setSelectedStop] =
    useState("");

  const [passengerLocation, setPassengerLocation] =
    useState(null);

  const [locationActive, setLocationActive] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const watchIdRef =
    useRef(null);


  // ===================================================
  // FETCH ROUTES + VEHICLES
  // ===================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        const headers = {
          Authorization:
            `Bearer ${token}`,
        };

        const [
          routeResponse,
          vehicleResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/api/routes`,
            { headers }
          ),
          axios.get(
            `${API_URL}/api/vehicles`,
            { headers }
          ),
        ]);

        const routeData =
          routeResponse.data || [];

        setRoutes(routeData);

        setVehicles(
          vehicleResponse.data || []
        );

        if (
          routeData.length > 0
        ) {
          const firstRoute =
            routeData.find(
              (route) =>
                route.name ===
                "Green Line"
            ) ||
            routeData[0];

          setSelectedLine(
            firstRoute.name
          );

          if (
            firstRoute.stops?.length
          ) {
            setSelectedStop(
              String(
                firstRoute.stops[0]
                  .sequence
              )
            );
          }
        }
      } catch (err) {
        console.error(
          "Tracking load error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load routes and vehicles."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  // ===================================================
  // SOCKET
  // ===================================================

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    socket.auth = {
      token,
    };

    const updateVehicle =
      (data) => {
        setVehicles(
          (previous) =>
            previous.map(
              (vehicle) => {
                if (
                  String(
                    vehicle._id
                  ) !==
                  String(
                    data.vehicleId
                  )
                ) {
                  return vehicle;
                }

                return {
                  ...vehicle,

                  status:
                    data.status ??
                    vehicle.status,

                  currentRoute:
                    data.currentRoute ??
                    vehicle.currentRoute,

                  occupiedSeats:
                    data.occupiedSeats ??
                    vehicle.occupiedSeats,

                  totalSeats:
                    data.totalSeats ??
                    vehicle.totalSeats,

                  currentLocation: {
                    latitude:
                      data.latitude ??
                      vehicle
                        .currentLocation
                        ?.latitude,

                    longitude:
                      data.longitude ??
                      vehicle
                        .currentLocation
                        ?.longitude,

                    accuracy:
                      data.accuracy ??
                      vehicle
                        .currentLocation
                        ?.accuracy,
                  },

                  lastLocationUpdate:
                    data.updatedAt ??
                    vehicle.lastLocationUpdate,
                };
              }
            )
        );
      };


    const handleLocation =
      (data) => {
        updateVehicle(data);
      };


    const handleSeats =
      (data) => {
        updateVehicle(data);
      };


    const handleStatus =
      (data) => {
        updateVehicle(data);
      };


    socket.on(
      "vehicleLocation",
      handleLocation
    );

    socket.on(
      "seatUpdated",
      handleSeats
    );

    socket.on(
      "vehicleStatusUpdated",
      handleStatus
    );

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(
        "vehicleLocation",
        handleLocation
      );

      socket.off(
        "seatUpdated",
        handleSeats
      );

      socket.off(
        "vehicleStatusUpdated",
        handleStatus
      );
    };
  }, []);


  // ===================================================
  // PASSENGER GPS
  // ===================================================

  const startPassengerGPS =
    () => {
      setLocationError("");

      if (
        !navigator.geolocation
      ) {
        setLocationError(
          "Your browser does not support location services."
        );
        return;
      }

      if (
        watchIdRef.current !== null
      ) {
        return;
      }

      const watchId =
        navigator.geolocation.watchPosition(
          (position) => {
            setPassengerLocation({
              latitude:
                position.coords.latitude,
              longitude:
                position.coords.longitude,
              accuracy:
                position.coords.accuracy,
            });

            setLocationActive(
              true
            );
          },
          (gpsError) => {
            setLocationActive(
              false
            );

            if (
              gpsError.code === 1
            ) {
              setLocationError(
                "Location permission was denied. Please allow location access."
              );
            } else if (
              gpsError.code === 2
            ) {
              setLocationError(
                "Your location is currently unavailable. Turn ON GPS/location services."
              );
            } else {
              setLocationError(
                "Unable to get your current location."
              );
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );

      watchIdRef.current =
        watchId;

      setLocationActive(
        true
      );
    };


  const stopPassengerGPS =
    () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      setLocationActive(
        false
      );

      setPassengerLocation(
        null
      );
    };


  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);


  // ===================================================
  // SELECTED ROUTE
  // ===================================================

  const selectedRoute =
    useMemo(
      () =>
        routes.find(
          (route) =>
            route.name ===
            selectedLine
        ),
      [routes, selectedLine]
    );


  const stops = useMemo(
    () => selectedRoute?.stops || [],
    [selectedRoute]
  );


  const selectedStopObject =
    useMemo(
      () =>
        stops.find(
          (stop) =>
            String(
              stop.sequence
            ) ===
            String(
              selectedStop
            )
        ),
      [stops, selectedStop]
    );


  // ===================================================
  // LINE CHANGE
  // ===================================================

  const changeLine =
    (line) => {
      setSelectedLine(line);

      const route =
        routes.find(
          (item) =>
            item.name === line
        );

      if (
        route?.stops?.length
      ) {
        setSelectedStop(
          String(
            route.stops[0]
              .sequence
          )
        );
      } else {
        setSelectedStop("");
      }
    };


  // ===================================================
  // FILTER VEHICLES
  // ===================================================

 
const activeVehicles = useMemo(() => {
  return vehicles.filter((vehicle) => {
    const isActive =
      vehicle.status === "ON" ||
      vehicle.status === "RUNNING";

    const isOnSelectedRoute =
      vehicle.currentRoute === selectedLine;

    const hasValidLocation =
      hasCoordinates(vehicle.currentLocation);

    return (
      isActive &&
      isOnSelectedRoute &&
      hasValidLocation
    );
  });
}, [vehicles, selectedLine]);



  // ===================================================
  // MAP CENTER
  // ===================================================

  const mapCenter =
    useMemo(() => {
      if (
        passengerLocation
      ) {
        return [
          passengerLocation.latitude,
          passengerLocation.longitude,
        ];
      }

      if (
        activeVehicles.length
      ) {
        const location =
          activeVehicles[0]
            .currentLocation;

        return [
          Number(
            location.latitude
          ),
          Number(
            location.longitude
          ),
        ];
      }

      const firstValidStop =
        stops.find(
          hasCoordinates
        );

      if (firstValidStop) {
        return [
          Number(
            firstValidStop.latitude
          ),
          Number(
            firstValidStop.longitude
          ),
        ];
      }

      return DEFAULT_CENTER;
    }, [
      passengerLocation,
      activeVehicles,
      stops,
    ]);


  // ===================================================
  // ROUTE POLYLINE
  // ===================================================

  const routeCoordinates =
    useMemo(() => {
      return stops
        .filter(
          hasCoordinates
        )
        .sort(
          (a, b) =>
            a.sequence -
            b.sequence
        )
        .map(
          (stop) => [
            Number(
              stop.latitude
            ),
            Number(
              stop.longitude
            ),
          ]
        );
    }, [stops]);


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <StudentLayout>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading live campus tracking...
        </div>
      </StudentLayout>
    );
  }


  return (
    <StudentLayout>
      <div
        style={{
          minHeight: "100%",
          background:
            "#f5f7fb",
          padding: "22px",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              color:
                "#64748b",
              fontSize:
                "12px",
              fontWeight:
                800,
              textTransform:
                "uppercase",
              letterSpacing:
                "0.08em",
            }}
          >
            CampusEV
          </div>

          <h1
            style={{
              margin:
                "5px 0",
              fontSize:
                "30px",
              fontWeight:
                850,
              color:
                "#0f172a",
            }}
          >
            Live EV Tracking
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "#64748b",
            }}
          >
            Track your campus EV and see its
            estimated arrival at your stop.
          </p>
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              marginBottom:
                "16px",
              padding:
                "13px 16px",
              borderRadius:
                "12px",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#b91c1c",
              fontWeight:
                700,
            }}
          >
            ⚠️ {error}
          </div>
        )}


        {/* =================================================
            CONTROLS
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "1fr 1fr auto",
            gap:
              "14px",
            marginBottom:
              "18px",
          }}
        >

          {/* LINE */}

          <div
            style={{
              background:
                "#ffffff",
              padding:
                "15px",
              borderRadius:
                "16px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display:
                  "block",
                fontSize:
                  "12px",
                fontWeight:
                  800,
                color:
                  "#64748b",
                marginBottom:
                  "8px",
              }}
            >
              SELECT LINE
            </label>

            <select
              value={
                selectedLine
              }
              onChange={(e) =>
                changeLine(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "11px 12px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #cbd5e1",
                background:
                  "#ffffff",
                fontWeight:
                  700,
                outline:
                  "none",
              }}
            >
              {routes.map(
                (route) => (
                  <option
                    key={
                      route._id ||
                      route.name
                    }
                    value={
                      route.name
                    }
                  >
                    {route.name}
                  </option>
                )
              )}
            </select>
          </div>


          {/* STOP */}

          <div
            style={{
              background:
                "#ffffff",
              padding:
                "15px",
              borderRadius:
                "16px",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display:
                  "block",
                fontSize:
                  "12px",
                fontWeight:
                  800,
                color:
                  "#64748b",
                marginBottom:
                  "8px",
              }}
            >
              SELECT STOP
            </label>

            <select
              value={
                selectedStop
              }
              onChange={(e) =>
                setSelectedStop(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "11px 12px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #cbd5e1",
                background:
                  "#ffffff",
                fontWeight:
                  700,
                outline:
                  "none",
              }}
            >
              <option value="">
                Choose your stop
              </option>

              {stops.map(
                (stop) => (
                  <option
                    key={
                      stop.sequence
                    }
                    value={
                      stop.sequence
                    }
                  >
                    {stop.sequence}.{" "}
                    {stop.name}
                  </option>
                )
              )}
            </select>
          </div>


          {/* GPS */}

          <div
            style={{
              display:
                "flex",
              alignItems:
                "stretch",
            }}
          >
            <button
              onClick={
                locationActive
                  ? stopPassengerGPS
                  : startPassengerGPS
              }
              style={{
                border:
                  "none",
                borderRadius:
                  "16px",
                padding:
                  "0 20px",
                minWidth:
                  "160px",
                background:
                  locationActive
                    ? "#fee2e2"
                    : "#2563eb",
                color:
                  locationActive
                    ? "#b91c1c"
                    : "#ffffff",
                fontWeight:
                  850,
                cursor:
                  "pointer",
              }}
            >
              {locationActive
                ? "⏹ STOP LOCATION"
                : "📍 MY LOCATION"}
            </button>
          </div>

        </div>


        {/* =================================================
            LOCATION MESSAGE
        ================================================= */}

        {locationError && (
          <div
            style={{
              marginBottom:
                "15px",
              padding:
                "12px 15px",
              borderRadius:
                "12px",
              background:
                "#fff7ed",
              color:
                "#c2410c",
              fontWeight:
                700,
            }}
          >
            📍 {locationError}
          </div>
        )}


        {/* =================================================
            SELECTED STOP
        ================================================= */}

        {selectedStopObject && (
          <div
            style={{
              background:
                "#eff6ff",
              border:
                "1px solid #bfdbfe",
              borderRadius:
                "15px",
              padding:
                "13px 16px",
              marginBottom:
                "16px",
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
                fontSize:
                  "22px",
              }}
            >
              📍
            </span>

            <div>
              <div
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#64748b",
                  fontWeight:
                    800,
                }}
              >
                YOUR SELECTED STOP
              </div>

              <strong
                style={{
                  color:
                    "#1e3a8a",
                }}
              >
                {
                  selectedStopObject.name
                }
              </strong>
            </div>
          </div>
        )}


        {/* =================================================
            MAP
        ================================================= */}

        <div
          style={{
            background:
              "#ffffff",
            borderRadius:
              "20px",
            overflow:
              "hidden",
            border:
              "1px solid #e2e8f0",
            boxShadow:
              "0 10px 35px rgba(15,23,42,.06)",
            marginBottom:
              "18px",
          }}
        >

          <div
            style={{
              height:
                "520px",
            }}
          >
            <MapContainer
              center={
                mapCenter
              }
              zoom={16}
              style={{
                width:
                  "100%",
                height:
                  "100%",
              }}
            >

              <MapRecenter
                center={
                  mapCenter
                }
              />

              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              {/* ROUTE */}

              {routeCoordinates.length >
                1 && (
                <Polyline
                  positions={
                    routeCoordinates
                  }
                  pathOptions={{
                    color:
                      selectedLine ===
                      "Green Line"
                        ? "#16a34a"
                        : "#2563eb",
                    weight: 5,
                    opacity: 0.7,
                  }}
                />
              )}


              {/* STOPS */}

              {stops
                .filter(
                  hasCoordinates
                )
                .map((stop) => {
                  const selected =
                    String(
                      stop.sequence
                    ) ===
                    String(
                      selectedStop
                    );

                  return (
                    <Marker
                      key={
                        `stop-${stop.sequence}`
                      }
                      position={[
                        Number(
                          stop.latitude
                        ),
                        Number(
                          stop.longitude
                        ),
                      ]}
                      icon={
                        selected
                          ? stopIcon
                          : L.divIcon({
                              className:
                                "",
                              html: `
                                <div style="
                                  width:20px;
                                  height:20px;
                                  border-radius:50%;
                                  background:#fff;
                                  border:3px solid ${
                                    selectedLine ===
                                    "Green Line"
                                      ? "#16a34a"
                                      : "#2563eb"
                                  };
                                  box-shadow:0 2px 7px rgba(0,0,0,.2);
                                "></div>
                              `,
                              iconSize:
                                [
                                  20,
                                  20,
                                ],
                              iconAnchor:
                                [
                                  10,
                                  10,
                                ],
                            })
                      }
                    >
                      <Popup>
                        <strong>
                          {stop.sequence}.{" "}
                          {
                            stop.name
                          }
                        </strong>

                        {selected && (
                          <div
                            style={{
                              marginTop:
                                "5px",
                              color:
                                "#2563eb",
                              fontWeight:
                                700,
                            }}
                          >
                            Your selected stop
                          </div>
                        )}
                      </Popup>
                    </Marker>
                  );
                })}


              {/* PASSENGER */}

              {passengerLocation && (
                <Marker
                  position={[
                    passengerLocation.latitude,
                    passengerLocation.longitude,
                  ]}
                  icon={
                    youIcon
                  }
                >
                  <Popup>
                    <strong>
                      You are here
                    </strong>

                    <br />

                    Accuracy:{" "}
                    {Math.round(
                      passengerLocation.accuracy
                    )}
                    m
                  </Popup>
                </Marker>
              )}


              {/* VEHICLES */}

              {activeVehicles.map(
                (vehicle) => {
                  const eta =
                    calculateETA(
                      vehicle,
                      stops,
                      selectedStopObject
                    );

                  return (
                    <Marker
                      key={
                        vehicle._id
                      }
                      position={[
                        Number(
                          vehicle
                            .currentLocation
                            .latitude
                        ),
                        Number(
                          vehicle
                            .currentLocation
                            .longitude
                        ),
                      ]}
                      icon={
                        evIcon
                      }
                    >
                      <Popup>

                        <div
                          style={{
                            minWidth:
                              "190px",
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "16px",
                              fontWeight:
                                800,
                              marginBottom:
                                "7px",
                            }}
                          >
                            🚌{" "}
                            {
                              vehicle.vehicleNumber
                            }
                          </div>

                          <div
                            style={{
                              color:
                                "#64748b",
                              fontSize:
                                "13px",
                            }}
                          >
                            {
                              vehicle.currentRoute
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                "10px",
                              display:
                                "grid",
                              gap:
                                "6px",
                            }}
                          >

                            <div>
                              💺{" "}
                              <strong>
                                {
                                  vehicle.totalSeats -
                                    vehicle.occupiedSeats
                                }
                              </strong>{" "}
                              seats available
                            </div>

                            <div>
                              📡{" "}
                              Live GPS
                            </div>

                            {eta && (
                              <div
                                style={{
                                  color:
                                    "#2563eb",
                                  fontWeight:
                                    800,
                                }}
                              >
                                ⏱️{" "}
                                {eta.minutes <
                                1
                                  ? "Arriving"
                                  : `~${eta.minutes} min`}
                              </div>
                            )}

                          </div>
                        </div>

                      </Popup>
                    </Marker>
                  );
                }
              )}

            </MapContainer>
          </div>

        </div>


        {/* =================================================
            VEHICLE CARDS
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap:
              "15px",
          }}
        >

          {activeVehicles.length ===
          0 ? (
            <div
              style={{
                gridColumn:
                  "1 / -1",
                background:
                  "#ffffff",
                borderRadius:
                  "18px",
                padding:
                  "24px",
                textAlign:
                  "center",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize:
                    "35px",
                  marginBottom:
                    "8px",
                }}
              >
                🚌
              </div>

              <strong>
                No running EV on this line
                right now
              </strong>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "#64748b",
                }}
              >
                When a driver starts an EV on
                {` ${selectedLine}`}, it will
                appear here automatically.
              </p>
            </div>
          ) : (
            activeVehicles.map(
              (vehicle) => {
                const eta =
                  calculateETA(
                    vehicle,
                    stops,
                    selectedStopObject
                  );

                const available =
                  vehicle.totalSeats -
                  vehicle.occupiedSeats;

                return (
                  <div
                    key={
                      vehicle._id
                    }
                    style={{
                      background:
                        "#ffffff",
                      borderRadius:
                        "18px",
                      padding:
                        "20px",
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
                        <strong
                          style={{
                            fontSize:
                              "19px",
                          }}
                        >
                          🚌{" "}
                          {
                            vehicle.vehicleNumber
                          }
                        </strong>

                        <div
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                            marginTop:
                              "4px",
                          }}
                        >
                          {
                            vehicle.currentRoute
                          }
                        </div>
                      </div>

                      <span
                        style={{
                          padding:
                            "6px 10px",
                          borderRadius:
                            "999px",
                          background:
                            "#dcfce7",
                          color:
                            "#15803d",
                          fontSize:
                            "11px",
                          fontWeight:
                            800,
                        }}
                      >
                        LIVE
                      </span>
                    </div>


                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap:
                          "10px",
                        marginTop:
                          "16px",
                      }}
                    >

                      <InfoCard
                        label="Available"
                        value={`${available} seats`}
                      />

                      <InfoCard
                        label="ETA"
                        value={
                          eta
                            ? eta.minutes <
                              1
                              ? "Arriving"
                              : `~${eta.minutes} min`
                            : "--"
                        }
                      />

                    </div>

                  </div>
                );
              }
            )
          )}

        </div>


        {/* =================================================
            COORDINATE NOTICE
        ================================================= */}

        {stops.length > 0 &&
          !stops.some(
            hasCoordinates
          ) && (
            <div
              style={{
                marginTop:
                  "16px",
                padding:
                  "14px 16px",
                borderRadius:
                  "13px",
                background:
                  "#fff7ed",
                border:
                  "1px solid #fed7aa",
                color:
                  "#9a3412",
                fontSize:
                  "13px",
                lineHeight:
                  1.6,
              }}
            >
              <strong>
                Map coordinates are not configured
                yet.
              </strong>
              <br />
              The stop names are ready. Once the
              real CEG campus coordinates are added,
              the stop markers, route line and ETA
              will work automatically.
            </div>
          )}

      </div>
    </StudentLayout>
  );
}


// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          "12px",
        borderRadius:
          "11px",
        background:
          "#f8fafc",
      }}
    >
      <div
        style={{
          fontSize:
            "11px",
          color:
            "#64748b",
          fontWeight:
            800,
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "5px",
          fontWeight:
            850,
          color:
            "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Tracking;