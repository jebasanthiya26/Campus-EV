import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";

import socket from "../socket";

import "leaflet/dist/leaflet.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// EV ICON
const vehicleIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",

  iconSize: [40, 40],

  iconAnchor: [20, 40],

  popupAnchor: [0, -40],
});


function Tracking() {

  const [vehicles, setVehicles] =
    useState([]);

  const [studentLocation, setStudentLocation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // --------------------------------
  // GET VEHICLES FROM MONGODB
  // --------------------------------

  useEffect(() => {

    const getVehicles = async () => {

      try {

        const response = await fetch(
          `${API_URL}/api/vehicles`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load vehicles"
          );
        }

        const data =
          await response.json();

        setVehicles(data);

        setLoading(false);

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load Campus EV vehicles."
        );

        setLoading(false);
      }
    };


    getVehicles();

const interval = setInterval(() => {
  getVehicles();
}, 3000);

return () => clearInterval(interval);

  }, []);


  // --------------------------------
  // STUDENT PHONE GPS
  // --------------------------------

  useEffect(() => {

    if (!navigator.geolocation) {

      setError(
        "GPS is not supported on this device."
      );

      return;
    }


    const watchId =
      navigator.geolocation.watchPosition(

        (position) => {

          setStudentLocation({

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy,

          });

        },

        (err) => {

          console.error(
            "Student GPS error:",
            err
          );

        },

        {
          enableHighAccuracy: true,

          maximumAge: 5000,

          timeout: 10000,
        }
      );


    return () => {

      navigator.geolocation.clearWatch(
        watchId
      );

    };

  }, []);


  // --------------------------------
  // RECEIVE LIVE VEHICLE GPS
  // --------------------------------

  useEffect(() => {

    const handleVehicleLocation =
      (data) => {

        console.log(
          "Live vehicle location:",
          data
        );


        setVehicles(
          (previousVehicles) => {

            return previousVehicles.map(
              (vehicle) => {

                if (
                  vehicle._id ===
                  data.vehicleId
                ) {

                  return {

                    ...vehicle,

                    status:
                      data.status,

                    currentRoute:
                      data.currentRoute,

                    occupiedSeats:
                      data.occupiedSeats,

                    totalSeats:
                      data.totalSeats,

                    currentLocation: {

                      latitude:
                        data.latitude,

                      longitude:
                        data.longitude,

                      locationName:
                        "Live GPS",

                    },

                  };

                }

                return vehicle;

              }
            );

          }
        );

      };


    socket.on(
      "vehicleLocation",
      handleVehicleLocation
    );


    return () => {

      socket.off(
        "vehicleLocation",
        handleVehicleLocation
      );

    };

  }, []);


  // --------------------------------
  // RECEIVE LIVE SEAT UPDATE
  // --------------------------------

  useEffect(() => {

    const handleSeatUpdate =
      (data) => {

        setVehicles(
          (previousVehicles) => {

            return previousVehicles.map(
              (vehicle) => {

                if (
                  vehicle._id ===
                  data.vehicleId
                ) {

                  return {

                    ...vehicle,

                    occupiedSeats:
                      data.occupiedSeats,

                    totalSeats:
                      data.totalSeats,

                  };

                }

                return vehicle;

              }
            );

          }
        );

      };


    socket.on(
      "seatUpdated",
      handleSeatUpdate
    );


    return () => {

      socket.off(
        "seatUpdated",
        handleSeatUpdate
      );

    };

  }, []);


  // --------------------------------
  // DISTANCE CALCULATION
  // --------------------------------

  const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
  ) => {

    const R = 6371;

    const dLat =
      (lat2 - lat1) *
      Math.PI /
      180;

    const dLon =
      (lon2 - lon1) *
      Math.PI /
      180;


    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

      Math.cos(
        lat1 * Math.PI / 180
      ) *

      Math.cos(
        lat2 * Math.PI / 180
      ) *

      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);


    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );


    return R * c;

  };


  // --------------------------------
  // ETA CALCULATION
  // --------------------------------

  const calculateETA = (vehicle) => {

    if (
      !studentLocation ||
      !vehicle.currentLocation
    ) {

      return "--";

    }


    const latitude =
      vehicle.currentLocation.latitude;

    const longitude =
      vehicle.currentLocation.longitude;


    if (
      latitude === 0 ||
      longitude === 0
    ) {

      return "--";

    }


    const distance =
      calculateDistance(

        studentLocation.latitude,

        studentLocation.longitude,

        latitude,

        longitude

      );


    // Approximate campus EV speed
    const averageSpeed = 20;


    const minutes =
      Math.max(
        1,
        Math.round(
          (distance /
            averageSpeed) *
            60
        )
      );


    return `${minutes} min`;

  };


  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {

    return (

      <div className="tracking">

        <h2>
          Live Vehicle Tracking
        </h2>

        <p>
          Loading Campus EV vehicles...
        </p>

      </div>

    );

  }


  // --------------------------------
  // ERROR
  // --------------------------------

  if (error) {

    return (

      <div className="tracking">

        <h2>
          Live Vehicle Tracking
        </h2>

        <p>
          {error}
        </p>

      </div>

    );

  }


  // --------------------------------
  // PAGE
  // --------------------------------

  return (

    <div className="tracking">

      <h2>
        Live Vehicle Tracking
      </h2>

      <p className="tracking-text">
        Current location of Campus EV
      </p>


      {/* STUDENT GPS */}

      {studentLocation && (

        <p>

          📱 Your Location:

          {" "}

          {studentLocation.latitude.toFixed(6)}

          ,

          {" "}

          {studentLocation.longitude.toFixed(6)}

        </p>

      )}


      {/* VEHICLES */}

      {vehicles.map((vehicle) => {

        const latitude =
          vehicle.currentLocation?.latitude;

        const longitude =
          vehicle.currentLocation?.longitude;


        const availableSeats =
          vehicle.totalSeats -
          vehicle.occupiedSeats;


        const routeColor =
          vehicle.currentRoute ===
          "Green Line"
            ? "green"
            : "blue";


        return (

          <div
            key={vehicle._id}
            className="tracking-container"
          >

            {/* VEHICLE INFO */}

            <div className="vehicle-info">

              <h2>
                🚌{" "}
                {vehicle.vehicleNumber}
              </h2>


              <p>

                Route:

                {" "}

                <strong
                  style={{
                    color: routeColor,
                  }}
                >
                  {vehicle.currentRoute}
                </strong>

              </p>


              <p>

                Status:

                {" "}

                <strong>
                  {vehicle.status}
                </strong>

              </p>


              <p>

                🪑 Available Seats:

                {" "}

                <strong>
                  {availableSeats}
                  /
                  {vehicle.totalSeats}
                </strong>

              </p>


              <p>

                ⏱️ ETA:

                {" "}

                <strong>
                  {calculateETA(
                    vehicle
                  )}
                </strong>

              </p>


              <p>

                📍 Location:

                {" "}

                {vehicle.currentLocation
                  ?.locationName}

              </p>

            </div>


            {/* MAP */}

            {latitude &&
              longitude &&
              latitude !== 0 &&
              longitude !== 0 && (

              <div className="map-box">

                <MapContainer

                  center={[
                    latitude,
                    longitude,
                  ]}

                  zoom={16}

                  scrollWheelZoom={true}

                  style={{
                    height: "450px",
                    width: "100%",
                  }}

                >

                  <TileLayer

                    attribution="&copy; OpenStreetMap contributors"

                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                  />


                  {/* VEHICLE */}

                  <Marker

                    position={[
                      latitude,
                      longitude,
                    ]}

                    icon={
                      vehicleIcon
                    }

                  >

                    <Popup>

                      🚌{" "}
                      {vehicle.vehicleNumber}

                      <br />

                      Route:

                      {" "}

                      {vehicle.currentRoute}

                      <br />

                      Seats:

                      {" "}

                      {availableSeats}
                      /
                      {vehicle.totalSeats}

                      <br />

                      ETA:

                      {" "}

                      {calculateETA(
                        vehicle
                      )}

                    </Popup>

                  </Marker>


                  {/* STUDENT */}

                  {studentLocation && (

                    <Marker

                      position={[
                        studentLocation.latitude,
                        studentLocation.longitude,
                      ]}

                    >

                      <Popup>

                        📱

                        {" "}

                        Your Location

                      </Popup>

                    </Marker>

                  )}

                </MapContainer>

              </div>

            )}


            {!latitude ||
              !longitude ||
              latitude === 0 ||
              longitude === 0 ? (

              <div className="map-box">

                <p>
                  📡 Waiting for vehicle GPS...
                </p>

              </div>

            ) : null}

          </div>

        );

      })}

    </div>

  );

}

export default Tracking;