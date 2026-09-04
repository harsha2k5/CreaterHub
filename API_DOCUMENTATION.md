# CreaterHub — REST API Specification & Architecture Guide

**Version**: 2.0 (Production-Ready Architecture)  
**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## Table of Contents
1. [Core Principles & Zero Fake Data Policy](#core-principles--zero-fake-data-policy)
2. [Authentication & Roles](#1-authentication--roles)
3. [Campaign Management & Geospatial Discovery](#2-campaign-management--geospatial-discovery)
4. [Campaign Applications & Matching Engine](#3-campaign-applications--matching-engine)
5. [Collaboration Lifecycle & Deliverables](#4-collaboration-lifecycle--deliverables)
6. [Official Meta Instagram Graph API Integration](#5-official-meta-instagram-graph-api-integration)
7. [Gemini AI Creator Analysis](#6-gemini-ai-creator-analysis)
8. [Escrow & Payments](#7-escrow--payments)
9. [Direct Pitches & Messaging](#8-direct-pitches--messaging)
10. [Reviews & Ratings](#9-reviews--ratings)
11. [Admin & Meta API Health Console](#10-admin--meta-api-health-console)
12. [Error Handling & Provenance Tags](#11-error-handling--provenance-tags)

---

## Core Principles & Zero Fake Data Policy

All endpoints enforce the **Real Data First** architecture:
- **No Mock or Synthetic Fallbacks**: If an Instagram account is not connected via official Meta OAuth, metric fields will return `null` and status `NOT_CONNECTED`.
- **Transparent Provenance**: Every metric returned contains an indicator of its origin: `OFFICIAL_INSTAGRAM_GRAPH_API`, `CALCULATED`, or `NOT_AVAILABLE`.
- **Relational Integrity**: 20 normalized tables with enforced foreign key cascades and timestamp tracking.

---

## 1. Authentication & Roles

### `POST /auth/register`
Register a new user account with role-specific profile initialization.
- **Request Body**:
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123",
  "name": "Jane Doe",
  "role": "creator",
  "city": "Bengaluru",
  "category": "Food & Lifestyle",
  "instagram_handle": "jane_eats",
  "bio": "Food explorer in Indiranagar",
  "latitude": 12.9784,
  "longitude": 77.6408
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_...",
    "email": "creator@example.com",
    "name": "Jane Doe",
    "role": "creator"
  }
}
```

### `POST /auth/login`
Authenticate existing user and retrieve session token.
- **Request Body**:
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123"
}
```
- **Response**: `200 OK` (includes token and user profile)

### `GET /auth/me`
Retrieve authenticated session user and linked profile information.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 2. Campaign Management & Geospatial Discovery

### `GET /campaigns`
Query active campaigns with optional Haversine spatial radius filtering.
- **Query Parameters**:
  - `lat` *(float)*: User latitude (e.g. `12.9784`)
  - `lng` *(float)*: User longitude (e.g. `77.6408`)
  - `radius` *(number, km)*: Maximum radius in kilometers (`1`, `5`, `10`, `25`, `50`, or custom)
  - `category` *(string)*: Niche filter (e.g. `Food & Beverage`)
  - `search` *(string)*: Text search across title, description, and deliverables
- **Response**: `200 OK`
```json
{
  "success": true,
  "campaigns": [
    {
      "id": "cmp_01",
      "title": "Summer Cold Brew Tasting",
      "brand_name": "Third Wave Coffee",
      "budget": 15000,
      "location_name": "Indiranagar, Bengaluru",
      "latitude": 12.9784,
      "longitude": 77.6408,
      "distance_km": 0.0,
      "match_score": 94,
      "deliverables": ["1x Instagram Reel", "2x Instagram Stories"]
    }
  ]
}
```

### `POST /campaigns` (Requires Brand Role)
Create a new targeted brand campaign with escrow commitment.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "Specialty Roast Reel Campaign",
  "category": "Food & Beverage",
  "description": "Showcase our single-origin pour-overs in a 30-second aesthetic reel.",
  "location_name": "Koramangala, Bengaluru",
  "latitude": 12.9352,
  "longitude": 77.6245,
  "budget": 8500,
  "target_radius_km": 10,
  "min_followers": 2000,
  "min_engagement_rate": 2.5,
  "deliverables": ["1x Instagram Reel", "1x Story with Link"]
}
```

### `GET /campaigns/:id`
Fetch single campaign details with brand profile, location coordinates, and deliverables specification.

---

## 3. Campaign Applications & Matching Engine

### `POST /applications` (Requires Creator Role)
Apply to an active campaign. Calculates multi-factor compatibility score upon submission.
- **Request Body**:
```json
{
  "campaign_id": "cmp_01",
  "pitch_message": "I regularly feature artisanal cafes in Indiranagar with 4.2% verified engagement.",
  "proposed_rate": 8500
}
```
- **Response**: `201 Created` (includes computed `match_score` from Haversine proximity, engagement rate, and niche overlap)

### `GET /applications/my-applications`
Retrieve all applications submitted by the authenticated creator with status flags.

### `PATCH /applications/:id/status` (Requires Brand Role)
Accept or reject a campaign applicant. Accepting automatically creates a collaboration and locks campaign budget in escrow.
- **Request Body**: `{"status": "ACCEPTED"}` or `{"status": "REJECTED"}`

---

## 4. Collaboration Lifecycle & Deliverables

### `GET /collaborations/:id`
Fetch active collaboration state, agreed deliverables, verification timeline, and escrow status.

### `POST /collaborations/:id/deliverables` (Requires Creator Role)
Submit proof of work for a scheduled deliverable (e.g. live post URL, reach screenshot).
- **Request Body**:
```json
{
  "deliverable_type": "REEL",
  "proof_url": "https://instagram.com/reel/C8...",
  "notes": "Posted during peak evening hours with brand tag and discount code."
}
```

### `PATCH /collaborations/:id/deliverables/:delivId/review` (Requires Brand Role)
Approve submitted work or request revisions.
- **Request Body**: `{"status": "APPROVED"}` or `{"status": "REVISION_REQUESTED", "feedback": "Please add brand hashtag #DrinkThirdWave"}`

### `POST /collaborations/:id/release-escrow` (Requires Brand Role)
Upon complete satisfaction with deliverables, release the held escrow funds directly to the creator.
- **Response**:
```json
{
  "success": true,
  "message": "Escrow released successfully. Creator wallet credited.",
  "payment": {
    "id": "pay_...",
    "amount": 8500,
    "status": "RELEASED",
    "gateway_reference": "SIM_ESC_REL_..."
  }
}
```

---

## 5. Official Meta Instagram Graph API Integration

### `GET /instagram/connect-url`
Generate official Meta OAuth v19.0 authorization redirect URL with necessary Graph API scopes (`instagram_basic`, `instagram_manage_insights`, `pages_show_list`).

### `POST /instagram/callback`
Exchange Meta authorization code for short-lived user token, exchange for 60-day long-lived token, inspect linked Facebook Page and Instagram Business Account, and persist credentials in `instagram_accounts`.
- **Request Body**: `{"code": "AQDf9..."}`

### `POST /instagram/sync`
Fetch live verified metrics from Meta Graph API endpoints:
- Profile: `/{ig_user_id}?fields=username,name,profile_picture_url,biography,followers_count,follows_count,media_count`
- Media: `/{ig_user_id}/media?fields=id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp`
- Computes real average engagement rate: $\frac{\text{Total Likes} + \text{Total Comments}}{\text{Followers} \times \text{Media Count}} \times 100$
- Records refresh event in `refresh_logs`.

### `GET /instagram/status`
Retrieve connection status. Returns `{ "connected": false, "status": "NOT_CONNECTED" }` if no official account is linked.

### `POST /instagram/disconnect`
Revoke tokens, delete synced media records, and reset account status.

---

## 6. Gemini AI Creator Analysis

### `POST /ai/creator-analysis`
Generate structured AI assessment using Google Gemini GenAI.
- **Pre-condition**: Strictly requires verified Instagram connection. Unconnected accounts are rejected with error `400 Bad Request: Official Instagram account must be connected first`.
- **Validation**: Schema-validated JSON response containing:
  - `overall_score` (0-100)
  - `engagement_score` (0-100)
  - `consistency_score` (0-100)
  - `content_quality_score` (0-100)
  - `strengths` (array of verified observations)
  - `growth_areas` (constructive feedback)
  - `suggested_brand_niches` (optimal commercial matches)
  - `summary` (executive brief)

---

## 7. Escrow & Payments

### `GET /payments/creator-earnings`
View total earnings, escrow in-progress, and past transaction records with audit IDs.

### `GET /payments/collaboration/:collabId`
Check escrow lock state, release status, and simulated or live gateway references.

---

## 8. Direct Pitches & Messaging

### `POST /messages/pitch` (Requires Brand Role)
Directly pitch a verified creator for a custom collaboration outside public campaigns.

### `GET /messages/conversations`
List active messaging threads between brands and creators.

### `POST /messages/send`
Send real-time chat messages within an established collaboration conversation.

---

## 9. Reviews & Ratings

### `POST /reviews`
Submit a 1-to-5 star rating and feedback upon collaboration completion. Updates recipient's rolling average rating.

---

## 10. Admin & Meta API Health Console

### `GET /admin/stats` (Requires Admin Role)
System-wide metrics: total users, active campaigns, escrow volume, and open disputes.

### `GET /admin/instagram-health` (Requires Admin Role)
Meta Graph API Observability Console:
- App credentials configuration check
- Active connected tokens count
- Expired tokens count
- Real-time refresh logs and error rate tracking

---

## 11. Error Handling & Provenance Tags

All errors adhere to standard HTTP status codes:
- `400 Bad Request`: Validation failure or missing prerequisite
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Insufficient role permission
- `404 Not Found`: Resource does not exist
- `500 Internal Server Error`: Unhandled server exception

Responses include a `provenance` field for data integrity verification:
```json
{
  "metric": "engagement_rate",
  "value": 3.82,
  "provenance": "OFFICIAL_INSTAGRAM_GRAPH_API",
  "last_synced_at": "2026-09-04T12:00:00.000Z"
}
```
