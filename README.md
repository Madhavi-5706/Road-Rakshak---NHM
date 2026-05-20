Markdown# 🛣️ Road Rakshak

Road Rakshak is an end-to-end community-driven road safety and hazard reporting ecosystem. The project enables daily commuters to report real-time road hurdles (like potholes, broken signals, or waterlogging) and pins verified incidents onto a public live-map. It acts as a bridge between citizens and local road administration to build a zero-accident ecosystem.

---

## 🏗️ Architecture Overview

The project is split into three distinct, decoupled components:
1. **Road Rakshak User Application:** The interface where citizens report hurdles, view live map data, and access road safety articles.
2. **Road Rakshak Admin Dashboard:** A secure control panel for authorities to verify reports based on severity, clear resolved spam, and publish news alerts.
3. **Road Rakshak Server:** A secure, high-performance RESTful API backend handling data validation, image processing, real-time sync, and geospatial coordinate queries.

---

## 🛠️ Technology Stack

### Frontend & Dashboards
*   **React.js & Redux.js** – State-driven frontend design pattern.
*   **Ant Design & Tailwind CSS** – Component framework and layout styling utilities.
*   **Mapbox / Google Maps API** – Geospatial rendering of real-time hazard flags.

### Backend Infrastructure
*   **Node.js & Express.js** – High-throughput server runtime and router framework.
*   **Socket.io** – Real-time bi-directional pipeline pushing immediate map updates from server to apps.
*   **Multer** – Form-data middleware for processing image uploads (hazard proofs).

### Database & Security
*   **MongoDB & Mongoose ODM** – Flexible document-schema database.
*   **JSON Web Tokens (JWT) & Bcrypt** – Stateless authorization mechanics and structural password hashing.
*   **Nodemailer** – Automated email dispatch pipelines for account and report verifications.

---

## 🔄 System Workflows & Flowcharts

### 1. The Citizen Hazard Reporting Pipeline
[User App] ──( Captures Geo-Location + Photo )──> [Multer / Server Storage]│[MongoDB (Status: Pending)]│[Admin Dashboard] <──( Pulls Queue via API )──────────────┘│├── [ Approve ] ──> Status: Verified ──> (Pushed via WebSockets) ──> [Live Public Map]└── [ Reject  ] ──> Status: Dropped (Spam prevention)
### 2. Live Report Verification State Flow Chart
┌───────────────┐        ┌──────────────┐        ┌─────────────┐│  User Submits │ ─────> │ Status:      │ ─────> │    Admin    ││  Hurdle Proof │        │ PENDING      │        │ Review Loop │└───────────────┘        └──────────────┘        └─────────────┘│           │Approve │           │ Reject (Spam)▼           ▼┌─────────────┐  ┌─────────────┐│ Status:     │  │  Purged /   ││ VERIFIED    │  │  Archived   │└─────────────┘  └─────────────┘││ (Issue Fixed by City)▼┌─────────────┐│   Delete/   ││  Resolved   │└─────────────┘
---

## ✨ Core Features

*   🔒 **Secure Administrative Layer:** Complete Bcrypt configuration protecting internal dashboards from unauthorized access.
*   📧 **Verified Citizen Profiles:** Email filtering mechanisms and mandatory user verification steps to establish account accountability.
*   📍 **Geospatial Mapping & Spam Prevention:** Hazards are locked to verified GPS strings (`is-valid-geo-coordinates`). Incident pins populate the map **only** post admin verification.
*   ⚡ **Instant Socket Updates:** Live operational nodes receive immediate map re-renders the moment an admin validates a ticket.
*   📰 **Community Safety Feeds:** Direct portal for administrative writers to post safety guidelines, regional news blocks, and road blockage reports.

---

## ⚙️ Development Environment Configuration

### Prerequisites
*   Node.js (v16.x or greater recommended)
*   Yarn or NPM package managers
*   A running instance of MongoDB Atlas or Local Community Engine

### Installation Blueprint

#### 1. Server Configuration
```bash
# Clone the server repository
git clone [https://github.com/krishna9304/road-rakshak-server.git](https://github.com/krishna9304/road-rakshak-server.git)
cd road-rakshak-server

# Install package profiles
npm install

# Setup your Environment Profile
cp .env.example .env
Note: Open your newly created .env file and configure your MONGODB_URI, JWT_SECRET, PORT, and email transporter options for Nodemailer.Bash# Initialize development server
npm run dev
2. Admin Dashboard ConfigurationBash# Clone the admin panel repository
git clone [https://github.com/krishna9304/road-rakshak-admin.git](https://github.com/krishna9304/road-rakshak-admin.git)
cd road-rakshak-admin

# Install matching modules via Yarn
yarn install

# Run the local webpack dev instance
yarn start
The client portal will spin up by default at http://localhost:3000.📂 Base API Endpoint ArchitectureMethodEndpointDescriptionAuth ScopePOST/api/auth/registerRegisters a standard user/admin node.PublicPOST/api/auth/loginValidates accounts, returns signature JWT.PublicGET/api/hurdles/allPulls all verified geo-coordinates for mapping.PublicPOST/api/hurdles/reportSubmits hazard proof using image payloads.Verified UserPATCH/api/admin/hurdle/:idUpdates the severity state or verifies hurdle.Admin OnlyDELETE/api/admin/hurdle/:idRemotely deletes / clears fixed pins from database.Admin Only📜 LicenseDistributed under the ISC License. See LICENSE inside individual code blocks for detailed property declarations.
