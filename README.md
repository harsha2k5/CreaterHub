# 🚀 CreaterHub — Brand × Local Creator Marketplace

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20WAL%20%7C%20PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **CreaterHub** is a production-grade, hyper-local Brand × Creator collaboration marketplace. It connects local businesses with authentic, verified Instagram creators within precise geographic radii (1 km – 50 km).
> Built under a strict **"REAL DATA FIRST. ZERO FAKE DATA"** architectural guarantee—all follower statistics, engagement metrics, and media lists originate exclusively from official Meta Graph API v19.0 connections or are clearly marked `Not Available`.

---

## 💎 Core Architectural Pillars

### 1. 🛡️ Real Data First — Zero Fake Data Guarantee
- **No Synthetic Numbers**: CreaterHub completely eliminates fake follower counters, benchmark guessers, and synthetic growth graphs.
- **Official Meta Graph API v19.0**: Integrates official OAuth, exchange of short-lived to 60-day long-lived access tokens, and live media synchronization.
- **Audit & Observability**: Every sync event is logged in `refresh_logs` and monitored via an Admin Health Console.
- **Transparent Provenance**: All displayed metrics clearly state their origin (`OFFICIAL_INSTAGRAM_GRAPH_API`, `CALCULATED`, or `NOT_AVAILABLE`).

### 2. 📍 Haversine Geospatial Discovery & Interactive Leaflet Maps
- Granular radius filtering: **1 km, 5 km, 10 km, 25 km, and Custom**.
- Direct spherical distance calculation via the Haversine formula:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- Visual discovery feed featuring map/grid view toggling, interactive pins, and live distance readouts.

### 3. 🎯 Multi-Factor Compatibility Matching Engine
Every creator-campaign pairing receives an objective compatibility score (0–100%) grounded in:
- **Location Proximity**: Geodesic proximity between business outlet and creator coordinates.
- **Verified Engagement Compliance**: Real engagement rate measured against campaign minimums.
- **Audience Tier Fit**: Follower boundaries ensuring appropriate creator reach.
- **Niche Overlap**: Semantic match between brand category and creator content pillars.
- **Budget Alignment**: Creator quote vs campaign escrow allocation.

### 4. 🧠 Gemini AI Creator Analysis
- Google Gemini GenAI analyzes verified Instagram metrics and recent media captions.
- Returns strict, schema-validated insights: Overall Score, Engagement Health, Consistency, Quality, Key Strengths, and Monetization Opportunities.
- **Integrity Rule**: Blocked when an account has not connected official Instagram credentials.

### 5. 🔒 6-Stage Collaboration Lifecycle & Escrow Safety
- **State Machine**: `APPLIED` ➔ `ACCEPTED` ➔ `ESCROW_LOCKED` ➔ `PROOF_SUBMITTED` ➔ `APPROVED` ➔ `ESCROW_RELEASED`.
- **Payment Abstraction**: Pluggable `PaymentService` architecture with an explicit **Development Escrow Simulator** mode and transaction references.
- Proof of work validation before brand payout release.

---

## 🗄️ Relational Database Architecture

The data layer is fully relational with **20 normalized tables** enforcing foreign keys, timestamp tracking, and cascade rules:

| Table | Purpose |
|---|---|
| `users` | Core credentials, role designation (`creator`, `brand`, `admin`), active status |
| `creator_profiles` | Bio, content niches, primary location coordinates, average rating |
| `brand_profiles` | Company name, business category, headquarters, website, verified flag |
| `instagram_accounts`| Meta OAuth access tokens, token expiration, Instagram Business User ID |
| `instagram_metrics` | Live follower counts, following, media counts, engagement rates |
| `instagram_media` | Synced recent posts, captions, like/comment counts, media URLs |
| `instagram_insights`| Impressive reach, impressions, audience demographics from Meta API |
| `ai_creator_analyses`| Gemini AI structured assessment JSON, pillar scores, audit timestamp |
| `campaigns` | Title, budget, location coordinates, target radius, requirements |
| `campaign_applications` | Creator pitch message, requested rate, computed match score |
| `collaborations` | State machine tracking active partnerships and delivery deadlines |
| `deliverables` | Specific deliverables (Reels, Stories, Carousels) with proof URLs |
| `conversations` | Discussion channels between brands and creators |
| `messages` | Direct chat messaging with timestamp ordering |
| `reviews` | Bidirectional 1-to-5 star ratings and written reviews |
| `payments` | Escrow ledger, lock timestamps, release references |
| `locations` | Reusable geographic coordinates and verified store outlets |
| `admin_actions` | Governance audit log (account suspensions, dispute resolutions) |
| `refresh_logs` | Meta Graph API sync attempts, duration, error logging |
| `notifications` | In-app alerts for milestone updates, escrow movements, and messages |

---

## ⚙️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts, Leaflet / React-Leaflet
- **Backend**: Node.js 22, Express.js 5, JSON Web Tokens, BCrypt.js
- **Database**: Relational SQLite via Node 22 built-in `node:sqlite` (zero compilation dependencies, WAL mode enabled), pluggable with PostgreSQL via `DATABASE_URL`
- **APIs**: Meta Graph API v19.0, Google Gemini GenAI SDK

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- Git

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/harsha2k5/CreaterHub.git
cd CreaterHub
npm install
```

### 2. Configure Environment Variables
Copy the environment template:
```bash
cp .env.example .env
```
Inspect `.env` and fill in any optional credentials:
```env
PORT=5000
DATABASE_URL=
JWT_SECRET=your_jwt_secret_key
VITE_API_URL=http://localhost:5000

# Meta Developer App (Optional for Live Meta Sync)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:5173/creator/dashboard

# Google Gemini API (Optional for Live AI Generation)
GEMINI_API_KEY=
```

### 3. Run Automated Tests
Run the comprehensive 4-suite backend test runner:
```bash
npm test
```
**Test Coverage Includes:**
- 🔐 Auth & Role Enforcement
- 📍 Haversine Geospatial Calculation & Creator Matching Engine
- 🛡️ Instagram Zero Fake Data Policy & Unconnected Fallback Blocking
- 🔄 Campaign Application, Milestone Escrow Lock & Release Lifecycle

### 4. Launch the Application
Run the backend REST API:
```bash
npm run server
```
In a separate terminal, launch the Vite development server:
```bash
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 👥 Demo Accounts (Pre-Seeded)

The database automatically seeds with realistic test accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@creatorhub.com` | `Admin@123` | Full access to Governance & Meta API Health Console |
| **Brand** | `contact@thirdwave.in` | `Brand@123` | Third Wave Coffee (Indiranagar, Active Campaigns) |
| **Brand** | `hello@bluetokai.com` | `Brand@123` | Blue Tokai Coffee Roasters (Koramangala) |
| **Creator** | `ananya@lifestyle.com` | `Creator@123` | Bengaluru lifestyle & food creator |
| **Creator** | `rohit@fitness.com` | `Creator@123` | High-engagement fitness creator |

---

## 📖 API Documentation

For the full REST API specification, headers, request/response schemas, and error codes, refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
