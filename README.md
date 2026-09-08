# 🚛 EcoRoute — Smart Waste Management & Garbage Routing System

**EcoRoute** is an intelligent, real-time waste collection and garbage truck routing web platform built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **shadcn/ui**, and **Supabase**. It streamlines urban waste collection by providing specialized interfaces for Administrators, Garbage Truck Drivers, and Citizens (House Owners).

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [Architecture & Portals](#-architecture--portals)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [What Has Been Done So Far](#-what-has-been-done-so-far)
- [Database Schema (Supabase)](#-database-schema-supabase)
- [Getting Started](#-getting-started)
- [What Needs To Be Done Next (Roadmap)](#-what-needs-to-be-done-next-roadmap)
- [Full Project Walkthrough](#-full-project-walkthrough)

---

## 🌟 Project Overview

Traditional municipal waste collection often suffers from inefficient routing, lack of real-time monitoring, delayed driver communication, and zero visibility for residents. 

**EcoRoute** solves these challenges by:
1. **Live Route Monitoring**: Admins monitor active collection trucks, driver assignments, and zone coverage in real-time.
2. **Driver Usability & HCI Tracking**: A minimalist mobile app for drivers with one-tap completion that logs human-computer interaction (HCI) performance metrics (click latencies and task times).
3. **Citizen Schedule Portal**: Residents easily check waste collection days, pickup times, and waste segregation guidelines for their neighborhood.

---

## 🏛️ Architecture & Portals

The application is structured into three primary portals:

| Portal | Route | Primary Audience | Description |
| :--- | :--- | :--- | :--- |
| **Admin Dashboard** | `/admin` | Municipal Admins / Operations | Real-time monitoring table of waste collection routes, driver assignments, and status tracking via Supabase. |
| **Driver App** | `/driver` | Truck Drivers & Field Workers | High-contrast, touch-optimized mobile interface to log task completions ("JOB DONE"), track HCI task duration, and report route issues. |
| **Citizen Portal** | `/citizen` | House Owners / Residents | Neighborhood garbage collection schedule lookup, pickup reminders, and waste reporting. |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & React**: [React 19](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `clsx`, `tailwind-merge`, `tw-animate-css`
- **Backend & Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- **Language**: JavaScript (ES6+ / JSX)

---

## 📂 Project Structure

```
ecoroute/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.jsx          # Admin Dashboard (Live Routes & Monitoring)
│   │   ├── citizen/
│   │   │   └── page.jsx          # House Owner Portal (Garbage Schedules)
│   │   ├── driver/
│   │   │   └── page.jsx          # Driver App (HCI tracking & Job Done action)
│   │   ├── favicon.ico
│   │   ├── globals.css           # Tailwind v4 styles
│   │   ├── layout.js             # App Root Layout
│   │   └── page.js               # Main Landing Page / Portal Navigation Hub
│   ├── components/
│   │   └── ui/                   # Reusable UI Components (shadcn/ui)
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       └── table.jsx
│   └── lib/
│       ├── supabase.js           # Supabase client initialization
│       └── utils.js              # Class merging utilities (cn)
├── public/                       # Static public assets
├── .env.local                    # Environment variables (Supabase Keys)
├── components.json               # shadcn/ui configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies & scripts
└── README.md                     # Project documentation
```

---

## ✅ What Has Been Done So Far

### 1. Framework Setup & Component Infrastructure
- Bootstrapped **Next.js 16** with App Router architecture.
- Installed and configured **Tailwind CSS v4** and **shadcn/ui** design system components (`Button`, `Card`, `Table`).

### 2. Supabase Integration (`src/lib/supabase.js`)
- Established client connection to Supabase using environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).

### 3. Admin Dashboard (`src/app/admin/page.jsx`)
- Built an interactive table displaying real-time waste collection routes.
- Dynamic data fetching from the `Routes` table in Supabase (`id`, `driver_name`, `zone`, `status`).

### 4. Driver App & HCI Tracking (`src/app/driver/page.jsx`)
- Created a touch-friendly mobile interface with a prominent **"✅ JOB DONE"** button.
- Built-in **HCI Usability Tracker**: Measures the time elapsed between opening the app and completing the task, logging metrics (`task_name`, `clicks`, `time_taken`) directly into the `HCILogs` table in Supabase.
- Includes a **"⚠️ Report Issue"** trigger for field obstacles.

### 5. Citizen Portal Skeleton (`src/app/citizen/page.jsx`)
- Initialized route structure for residents to check schedule details.

---

## 🗄️ Database Schema (Supabase)

To run the project smoothly, ensure your Supabase database has the following tables:

### 1. `Routes` Table
```sql
CREATE TABLE "Routes" (
  id SERIAL PRIMARY KEY,
  driver_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample Data:
INSERT INTO "Routes" (driver_name, zone, status) VALUES
('John Doe', 'Colombo 05', 'In Progress'),
('Kamal Perera', 'Kandy Central', 'Completed'),
('Saman Kumara', 'Galle Fort', 'Pending');
```

### 2. `HCILogs` Table
```sql
CREATE TABLE "HCILogs" (
  id SERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  clicks INTEGER DEFAULT 1,
  time_taken BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/buddhiab/ecoroute.git
   cd ecoroute
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser:
   - **Admin**: `http://localhost:3000/admin`
   - **Driver**: `http://localhost:3000/driver`
   - **Citizen**: `http://localhost:3000/citizen`

---

## 🚧 What Needs To Be Done Next (Roadmap)

Here is the step-by-step roadmap to complete the EcoRoute project:

### Phase 1: Core Navigation & User Landing Hub
- [ ] **Redesign Landing Page (`/`)**: Replace boilerplate with a modern dashboard hub allowing seamless navigation between Admin, Driver, and Citizen views with statistics.

### Phase 2: Citizen Portal Expansion (`/citizen`)
- [ ] **Interactive Schedule Finder**: Search by Zone/Neighborhood to view pickup days (Organic, Recyclables, E-Waste).
- [ ] **Live Truck Tracker**: Display estimated time of arrival (ETA) for garbage trucks in the resident's zone.
- [ ] **Issue Reporter**: Form for citizens to report missed pickups or overflowed public bins.

### Phase 3: Advanced Driver Capabilities (`/driver`)
- [ ] **Multi-stop Route List**: Checklists for individual street pickups in the assigned zone.
- [ ] **Issue Report Modal**: Interactive modal to select issue types (Road Blocked, Truck Breakdown, Hazardous Waste) and submit to Supabase.
- [ ] **GPS / Map View**: Integration with Mapbox or Google Maps for route navigation.

### Phase 4: Admin Dashboard Features (`/admin`)
- [ ] **Route Management**: Add, edit, reassign, and delete routes.
- [ ] **HCI Analytics Panel**: Display graphs/charts of driver response times and usability data from `HCILogs`.
- [ ] **Issue Resolution Center**: Review and resolve reported driver/citizen issues.

### Phase 5: Authentication & Real-time Updates
- [ ] **Role-based Auth**: Integrate Supabase Auth for Admin login and Driver accounts.
- [ ] **Real-time Subscriptions**: Enable Supabase real-time listeners (`supabase.channel()`) on the Admin dashboard for instant updates when drivers click "JOB DONE".

---

## 📖 Full Project Walkthrough

```
                            ┌────────────────────────┐
                            │    EcoRoute Hub        │
                            │   http://localhost:3000│
                            └───────────┬────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             │                          │                          │
             ▼                          ▼                          ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
   │  Admin Dashboard  │      │    Driver App     │      │  Citizen Portal   │
   │      (/admin)     │      │     (/driver)     │      │    (/citizen)     │
   └─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘
             │                          │                          │
             │ Fetches live             │ Logs completion          │ Checks schedule &
             │ routes                   │ & HCI metrics            │ reports issues
             ▼                          ▼                          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                            Supabase Database                            │
   │      - Routes Table (id, driver_name, zone, status)                     │
   │      - HCILogs Table (id, task_name, clicks, time_taken)                │
   └─────────────────────────────────────────────────────────────────────────┘
```

1. **Admin Workflow**: Admin navigates to `/admin`, views active routes loaded dynamically from the `Routes` table, and tracks live status across municipal zones.
2. **Driver Workflow**: Driver opens `/driver` on a mobile device, sees assigned route details ("Route 101 - Colombo 05"), and taps "JOB DONE". EcoRoute calculates execution latency and logs HCI data to `HCILogs`.
3. **Citizen Workflow**: House owner opens `/citizen` to verify garbage collection schedules, reducing missed pickups and improper waste disposal.
