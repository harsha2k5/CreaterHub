# CreatorHub — Brand × Creator Marketplace & Escrow Platform

Production-quality, modern, full-stack web platform connecting local Brands with Content Creators/Influencers for location-based promotional campaigns with Escrow financial security.

---

## 🌟 Key Features

- **Relational SQLite Database Persistence**: 16 schema tables with pre-seeded startup demo data.
- **Location Radius Search & Leaflet Maps**: High-precision Haversine spatial distance calculations (1 km, 5 km, 10 km, 25 km).
- **Escrow Financial Security**: 6-step collaboration contract pipeline with instant payout release simulation.
- **Brand & Creator Persona Portals**: Dedicated authentication, dashboard metrics (Recharts), applicant review, and chat messaging.

---

## 🚀 Quickstart Guide

```bash
# 1. Install Dependencies
npm install

# 2. Start Backend Express API Server (Port 5000)
node server/index.cjs

# 3. Start Frontend React Vite App (Port 5173)
npx vite --port 5173
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🔑 Account Credentials

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | `admin@creatorhub.io` | `admin123` | Admin |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), JWT, bcryptjs
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Leaflet Maps
