# DPR Management System

A production-ready Employee Daily Progress Report (DPR) Management System built with the MERN stack.

## Features

- **JWT Authentication** with role-based access (Admin / Employee)
- **Office Wi-Fi IP restriction** middleware on all API requests
- **Employee registration** with admin approval workflow
- **Admin dashboard** with analytics charts and activity feeds
- **Employee management** — create, approve, reject, activate, deactivate, delete, reset password, export
- **Candidate management** and multi-assignment support
- **Attendance tracking** with IP, device, and browser logging
- **Daily Progress Reports** with duplicate prevention per day
- **Reports export** (CSV / PDF)
- **Dark / Light mode**, responsive corporate UI
- **Seed data** for quick demo setup

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React (Vite), Tailwind CSS, React Router, Axios, React Hook Form, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Helmet, Express Validator |
| Security | Office IP middleware, CORS, password hashing, protected routes |

## Prerequisites

- Node.js 18+
- MongoDB running locally (or MongoDB Atlas connection string)

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dprsystem.com | admin123 |
| Employee | employee1@dprsystem.com | employee123 |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dpr_system
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Office network access is configured by the **admin in Settings** (not in `.env`). See [Office IP Restriction](#office-ip-restriction) below.

## Project Structure

```
DPR_System/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, Office IP, validation, upload
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── seed/           # Database seeder
│   │   ├── utils/          # Helpers
│   │   └── validators/     # Express validators
│   ├── uploads/            # Profile photos
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # Axios services
        ├── components/     # UI, layout, charts
        ├── context/        # Auth & theme
        ├── pages/          # Route pages
        └── routes/         # Route guards
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Employee registration |
| `GET /api/dashboard/admin` | Admin dashboard data |
| `GET /api/dashboard/employee` | Employee dashboard data |
| `GET /api/employees` | List employees (admin) |
| `POST /api/attendance` | Mark attendance (employee) |
| `POST /api/dpr` | Submit DPR (employee) |
| `GET /api/settings` | System settings |

All `/api/*` routes pass through **OfficeIPMiddleware**.

## Office IP Restriction

Every API request from **employees** is checked against the **Office WiFi IP** saved by the admin in **Settings**. Employees on mobile data or other WiFi can still log in, but they see a notice instead of app features. **Admins** can access from any network.

```json
{
  "success": false,
  "message": "This application can only be accessed from the office network."
}
```

HTTP status: **403**

### First-time setup

1. Log in as admin from the office WiFi (or from `localhost` during development).
2. Open **Settings** and click **Use This IP** to capture the current office network IP.
3. Save settings. All employees on the same office WiFi can then use the app.

### Supported formats

| Format | Example | Use when |
|--------|---------|----------|
| Single public IP | `103.45.67.89` | Server is on the cloud; office WiFi shares one public IP |
| Subnet (CIDR) | `192.168.1.0/24` | Server runs on the office LAN; each device has a different local IP |
| Multiple entries | `103.45.67.89, 192.168.1.0/24` | Comma-separated list |

Only the admin can change the office IP. It is stored in the database, not in code or `.env`.

## License

MIT
