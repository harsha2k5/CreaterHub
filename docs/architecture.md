# CreaterHub — System Architecture & Technical Design Document

## 1. System Overview
**CreaterHub** is a production-grade Brand × Creator collaboration marketplace. It connects brands with micro and nano creators within hyper-local geographic radii, automating creator discovery, AI-assisted campaign generation, multi-factor compatibility scoring, real-time social metrics verification, 6-stage collaboration lifecycle tracking, and simulated milestone escrow payouts.

```mermaid
graph TD
    User([Brand / Creator User]) -->|HTTPS / WSS| Client[Vite + React 19 Frontend]
    Client -->|REST API Requests| API[Express.js REST API Server :5000]
    API -->|Auth JWT & Role Guard| Middleware[Auth & Validation Middleware]
    Middleware -->|Queries & Updates| DB[(MongoDB Engine :27017)]
    API -->|OAuth 2.0 & Graph API| Meta[Meta Graph API / Verified Mock Provider]
    API -->|GenAI Campaign Engine| Gemini[Google Gemini / Benchmark Engine]
```

---

## 2. Core Architecture Components

### 2.1 Frontend Architecture (`src/`)
- **Core Framework**: React 19 with Vite and TypeScript.
- **Styling**: Tailwind CSS v4 design system with light/dark theme variables.
- **Data Visualization**: Recharts (multi-metric Area & Bar charts for Brand ROI, Campaign Reach, Creator Audience Growth).
- **Geospatial Mapping**: React-Leaflet with OpenStreetMap tiles for radius-based outlet and campaign exploration.
- **Authentication Context**: React Context API (`AuthContext.tsx`) maintaining JWT session, active role switching (`brand`, `creator`, `admin`), profile data, and real-time notification polling.

### 2.2 Backend Architecture (`server/`)
- **Runtime**: Node.js with Express.js modular routing.
- **Data Modeling**: Mongoose schemas mapping to MongoDB collections (`users`, `creators`, `brands`, `campaigns`, `applications`, `collaborations`, `reviews`, `messages`, `notifications`, `reports`).
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`), bcrypt password hashing, and role-based access control (`authenticateToken`, `requireAdmin`).

---

## 3. Algorithmic Engines

### 3.1 Creator Performance Scoring Engine (`0–100`)
Every creator on the platform receives a dynamic score computed across 6 core pillars:
$$\text{Score} = \sum (\text{Weight}_i \times \text{PillarScore}_i)$$

1. **Engagement Rate (25%)**: Evaluates average likes, comments, and views against industry benchmarks.
2. **Audience Growth & Velocity (20%)**: Follower trajectory and reach stability.
3. **Content Performance (20%)**: Reel view-through rate and posting cadence.
4. **Campaign Success Rate (20%)**: Historical brand rating (1-5 stars) and completed collaboration count.
5. **Profile Completeness (10%)**: Rate cards, bio, location, categories, connected social links.
6. **Delivery Reliability (5%)**: On-time content proof submission rate without revision disputes.

### 3.2 Modular AI Matchmaking Engine
When brands pitch creators or evaluate applicants for a campaign, the platform computes a matching score:
- **Location Proximity (25%)**: Haversine distance between campaign outlet and creator coordinates.
- **Engagement Compliance (25%)**: Creator engagement rate vs campaign minimum requirement.
- **Audience Fit (20%)**: Creator followers within campaign minimum and maximum limits.
- **Niche Alignment (15%)**: Category overlap between brand campaign and creator profile.
- **Creator Performance Score (10%)**: Overall platform quality rating.
- **Budget Compatibility (5%)**: Creator starting price vs reward per creator.

```mermaid
sequenceDiagram
    autonumber
    actor Brand
    participant Client as Frontend
    participant Server as Express Server
    participant Matching as AI Match Engine
    participant DB as MongoDB

    Brand->>Client: Open "AI Match by Campaign"
    Client->>Server: GET /api/campaigns/:id/matches
    Server->>DB: Fetch Campaign Requirements & Active Creators
    Server->>Matching: Calculate Compatibility (Proximity, Niche, Reach, Score)
    Matching-->>Server: Ranked Match Results + Pass/Fail Reasons
    Server-->>Client: Top Creators with Match % & Distance
    Client-->>Brand: Interactive Cards with 1-Click Pitch
```

---

## 4. Collaboration & Escrow Lifecycle

The collaboration follows a strict 6-stage milestone state machine:

```mermaid
stateDiagram-v2
    [*] --> Agreement_Escrow_Funded: Application Accepted / Direct Pitch
    Agreement_Escrow_Funded --> Product_Outlet_Visit: Brand Deposit Secured in Escrow
    Product_Outlet_Visit --> Content_Production: Brief Confirmed
    Content_Production --> Proof_Submitted: Creator Submits Live Reel URL & Caption
    Proof_Submitted --> Content_Approved: Brand Reviews & Verifies Deliverable
    Proof_Submitted --> Content_Production: Revision Requested
    Content_Approved --> Escrow_Payout_Released: Brand Marks Payment Done
    Escrow_Payout_Released --> Reviews_Submitted: Dual-Sided Star Rating & Feedback
    Reviews_Submitted --> [*]
```

---

## 5. Creator Analytics Engine & Data Provenance Pipeline

To avoid scraping Instagram and to guarantee enterprise-level data transparency, CreaterHub implements a multi-tier analytical pipeline:

```mermaid
flowchart TD
    subgraph S1["1. Ingestion Layer"]
        MetaAPI["Official Meta Graph API (v19.0)"]
        MockProvider["Deterministic Benchmark Provider"]
        Collector["Data Collector Service\n(server/services/instagramCollector.cjs)"]
        MetaAPI --> Collector
        MockProvider --> Collector
    end

    subgraph S2["2. Normalization Layer"]
        Normalizer["Data Normalizer\n(server/services/analyticsNormalizer.cjs)"]
        Collector --> Normalizer
        Normalizer -->|"Attaches Provenance Tags"| CleanData["Normalized Data Envelope\n{ value, source: 'API' | 'CALCULATED' | 'ESTIMATE' }"]
    end

    subgraph S3["3. Analytics Engine"]
        Engine["Creator Analytics Engine\n(server/services/creatorAnalyticsEngine.cjs)"]
        CleanData --> Engine
        DBHistory["MongoDB Snapshots & Collabs"] --> Engine
        Engine --> C1["Audience Cluster\n(Followers, Gained, Growth %, Demographics)"]
        Engine --> C2["Content Cluster\n(Posts, Reels, Avg Views, Likes, Saves, Shares)"]
        Engine --> C3["Engagement Cluster\n(Engagement Rate %, Best Times, Top Content)"]
        Engine --> C4["Campaign Performance Cluster\n(Reach, Impressions, Clicks, Earnings)"]
    end

    subgraph S4["4. Persistence & Presentation"]
        MongoDB[(MongoDB Database)]
        Engine --> MongoDB
        MongoDB --> APIEndpoint["REST API: /api/instagram/analytics"]
        APIEndpoint --> Dashboard["Creator Dashboard\n(src/pages/CreatorDashboard.tsx)"]
    end
```

### Data Provenance Distinction
Every metric displayed to users carries explicit provenance metadata:
1. **API-Provided Data**: Raw metrics directly returned from official Meta Graph API endpoints (Total Followers, Following, Post Count, Media Likes/Comments).
2. **Calculated Data**: Algorithmic aggregations computed by CreaterHub (Monthly Follower Gain, Growth %, Engagement Rate Formula, Average Saves/Shares, Best Posting Times, Campaign Earnings).
3. **Benchmark / Estimated Data**: Demographics and reach distributions when running in reference benchmark mode.

---

## 6. Security & Data Integrity
- **Stateless Tokens**: JWTs expire automatically; secrets stored strictly in environment variables.
- **No Secret Leaks**: Clean `.env.example` provided; `.env` excluded in `.gitignore`.
- **Safe Simulated Escrow**: Clearly labeled simulation ensuring complete auditability without claiming false money movements.
- **Meta Graph API Compliance**: Transparent mock-provider fallback when production credentials are absent, strictly forbidding HTML web scraping.

