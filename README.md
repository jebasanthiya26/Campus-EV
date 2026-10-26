# CampusEV — Smart Fleet Management

CampusEV is a React/Vite frontend with an Express, Socket.IO and MongoDB backend. It supports role-based login, student/faculty vehicle tracking, driver route/GPS/seat controls, and a management fleet dashboard.

## Requirements
- Node.js 20+ recommended
- MongoDB Atlas database user and a reachable cluster

## Configure environment files
1. Copy `backend/.env.example` to `backend/.env` and set your MongoDB connection string and a new random `JWT_SECRET`.
2. Copy `.env.example` to `.env.local` for the frontend. On one computer, `VITE_API_URL=http://localhost:5000` is correct.
3. Never commit `.env`, `.env.local`, passwords, database connection strings or JWT secrets.

## Start locally (one computer)
Open two terminals from the project folder.

Backend terminal:
```cmd
cd backend
npm install
npm run dev
```

Frontend terminal:
```cmd
npm install
npm run dev
```
Open the Vite URL (usually `http://localhost:5173`).

## Two-laptop classroom demo
Both laptops must be on the same trusted Wi-Fi/network and be able to reach the backend laptop. On the backend laptop, find its private IPv4 address with `ipconfig` (for example `192.168.1.10`).

1. In the project root `.env.local`, set `VITE_API_URL=http://192.168.1.10:5000` using the actual backend laptop IP.
2. Start the backend on the backend laptop with `npm run dev` from `backend`. The server binds to `0.0.0.0`.
3. Start the frontend with `npm run dev -- --host 0.0.0.0`.
4. On the student laptop, open `http://<FRONTEND-LAPTOP-IP>:5173`. Allow Node.js through Windows Firewall on a private network if prompted.
5. Register/login as Driver on one browser and Student/Faculty on the other. Select a vehicle as the driver, choose a route, start the trip, then open **GPS Tracking**.
6. Use **Turn on GPS** when browser geolocation is available. For a repeatable classroom test on plain HTTP, use **Start demo movement**; it is clearly labelled as simulated and is not real vehicle GPS.
7. Open the student **Live tracking** page. Confirm that the vehicle marker and coordinates update. Keep the driver GPS page open while testing because leaving it stops that page's GPS watcher.

Browser geolocation generally requires HTTPS or localhost. For a second laptop visiting a private-LAN HTTP address, browser GPS may be blocked; use demo movement for software demonstration or deploy the app over HTTPS to test real device GPS. A moving map marker proves that the software pipeline works, not that an actual EV has a GPS tracker installed.

## Account roles
Registration currently allows Student, Faculty, Driver and Management accounts to simplify a classroom demo. For a real deployment, restrict Driver and Management registration to approved/admin-created accounts.

## GPS data flow
Driver browser GPS or demo coordinates -> authenticated Socket.IO `gpsUpdate` -> backend validates driver/vehicle assignment and stores coordinates in MongoDB -> backend emits `vehicleLocation` -> student tracking map and management monitoring refresh.

## Important notes
- Student/Faculty dashboard vehicle and seat figures are loaded from the API; they are not hard-coded demo values.
- Student/Faculty Profile navigation has been removed. Account name and role remain in the header.
- Driver overview, GPS, seat management and vehicle status are separate sidebar sections.
- Management Dashboard, Vehicles and Live Monitoring are separate interactive tabs.
- Validate database connectivity and use a private/HTTPS deployment before any real-world use.
