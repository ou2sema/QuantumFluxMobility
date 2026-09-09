# AUTORENT CAR TUNISIA 🇹🇳
### Production Car Rental & Fleet Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-cyan.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-amber.svg)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-teal.svg)](https://tailwindcss.com/)

**AUTORENT CAR TUNISIA** is a full-stack, enterprise-grade vehicle rental and fleet management platform tailored specifically for the Tunisian automotive rental market. Built with high precision, speed, and security, it empowers rental agencies to manage daily operations, fleet availability, digital contracts, multi-point photo inspections, and client self-service portals.

---

## ✨ Key Features

### 1. Operations Dashboard ("Ce qui nécessite votre attention aujourd'hui")
- **Operational Metrics**:
  - 🚗 **6 Pickups** (Départs prévus)
  - 🔄 **4 Returns** (Retours attendus)
  - ⚠️ **2 Overdue** (Véhicules en retard avec alertes)
  - 🛠️ **3 Unavailable** (Véhicules en atelier/maintenance)
  - 💳 **5 Unpaid** (Factures à régler en TND)
  - ✍️ **2 Awaiting Sign** (Contrats en attente de signature numérique)
- **Interactive Daily Operations Timeline**:
  - `09:00` Peugeot 208 — Pickup · Paid · Documents ✓ (1-Tap Fast Check-in)
  - `10:30` Renault Clio — Return · Inspection pending (1-Tap Return Inspection)
  - `11:00` Volkswagen Golf 8 — Pickup · Documents missing ⚠️ (Direct Document Verification)
- **1-Tap Quick Actions**:
  - `+ New Booking` (Fast Booking Wizard)
  - `+ Check-in` (Direct departure handling)
  - `+ Check-out` (Direct return inspection)
  - `+ New Client` (Customer onboarding)
  - `+ Add Vehicle` (Fleet expansion)

### 2. Tunisian Market & Pricing Engine
- **Currency**: Tunisian Dinar (**TND / DT**).
- **Locations**: Tunis-Carthage Airport (TUN), Enfidha-Hammamet, Monastir, Djerba-Zarzis, Sousse, Sfax, Tunis Centre.
- **Seasonality**: High summer peak (+35%), shoulder season (+15%), low season rates.
- **Long-Term Discounts**: 10% off for 7+ days, 20% off for 14+ days.
- **Taxation**: Tunisian rental VAT rate (7%).
- **Double-Booking & Availability Engine**: Strict millisecond interval collision detection preventing overlapping bookings and maintenance downtime conflicts.

### 3. Client Portal ("Espace Client Privilège")
- **Welcome**: Personalized customer experience (`Bienvenue, Ahmed`).
- **Next Rental Spotlight**: Direct view of active vehicle, dates, airport pickup, and contract status.
- **5 Direct Client Actions**:
  1. *Consulter le contrat / View booking* (Full breakdown & receipt)
  2. *Téléverser les justificatifs / Upload documents* (Driving license recto/verso, national CIN/Passport)
  3. *Signer le contrat / Sign agreement* (Interactive touch/mouse signature pad)
  4. *Payer en ligne / Pay* (Secure online checkout simulator with instant confirmation)
  5. *Assistance 24/7 / Contact AUTORENT* (+216 71 754 000, contact@autorent.tn)
- **Client Data Isolation**: Strict RBAC ensuring clients can only view and manage their own bookings and documents.

### 4. Digital Rental Agreements & PDF Export
- Generates official legal contracts stamped with **AUTORENT CAR TUNISIA SARL** legal mentions, RC, and matricule fiscal.
- Captures digital signatures with timestamp certification.
- 1-click **PDF Export** using `jspdf` for printing or offline storage.

### 5. Multi-Point Vehicle Inspections (Check-In & Check-Out)
- 6-point mandatory photo capture: Front, Rear, Left, Right, Interior, Dashboard.
- Fuel gauge slider and odometer tracker with automatic excess km and missing fuel surcharges.
- Interactive interactive damage mapper.

### 6. Role-Based Access Control (RBAC)
- `ADMIN`: Full platform configuration, user roles, branch management, logs.
- `MANAGER`: Fleet, bookings, financial reports, approvals.
- `AGENT`: Desk operations, counter check-in/out, client onboarding.
- `FLEET`: Vehicle maintenance scheduling, technical inspections, damage logs.
- `ACCOUNTANT`: Invoices, receipts, deposits, payment reconciliation.
- `CUSTOMER`: Client portal access only, own bookings, digital contract signing.

---

## 🏗️ Architecture

```
/
├── src/
│   ├── components/
│   │   ├── dashboard/        # Operations dashboard & timeline
│   │   ├── portal/           # Client portal & digital signing
│   │   ├── bookings/         # Booking list, wizard, calendar
│   │   ├── fleet/            # Vehicle fleet management & cards
│   │   ├── clients/          # Client CRM & KYC verification
│   │   ├── inspections/      # 6-point photo inspection & check-in/out
│   │   ├── ui/               # AutoRentLogo, TactileButton, SignaturePad
│   │   └── navigation/       # Responsive TopNav & bottom mobile navigation
│   ├── features/
│   │   └── bookings/
│   │       ├── pricing.ts      # TND pricing, extras, seasonal multipliers
│   │       ├── availability.ts # Interval overlap & availability logic
│   │       └── booking-state.ts# Lifecycle state machines (Vehicle & Booking)
│   ├── services/             # Firestore & domain business logic services
│   ├── schemas/              # Zod validation schemas
│   ├── context/              # App, Fleet, Booking, Client, Agency contexts
│   ├── data/                 # Tunisian mock fleet, clients & agencies
│   └── types.ts              # Full domain model definitions
├── tests/
│   └── run-tests.ts          # Automated domain & logic test suite
├── firestore.rules           # Production security rules with RBAC & isolation
└── metadata.json             # AI Studio app metadata
```

---

## 🧪 Testing

Run the automated test suite covering pricing calculations, availability collision checks, state transitions, and RBAC:

```bash
npm test
```

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Privacy
- **Original Repository Protected**: Completely separate, independent project with no link to legacy repositories.
- **Client Data Isolation**: Enforced both in UI state logic and in `firestore.rules`.
- **Zero Hardcoded Secrets**: Built following enterprise Twelve-Factor app principles.

---
© 2026 AUTORENT CAR TUNISIA. All rights reserved.
