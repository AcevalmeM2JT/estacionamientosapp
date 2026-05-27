---
name: parking-app-dev
description: Use when developing the parking management application (estacionamientosapp). Provides architecture, database schema, phase planning, and development guidelines for the MVP. Trigger when working on any feature related to parking spots, license plate tracking, pricing, admin dashboard, worker management, or real-time availability.
---

# Parking Management App - Development Guide

## Project Overview

A web application where parking facilities (official or private) can register and display in real-time:
- Available parking spots count
- Pricing per minute, hour, day, or month

## System Actors

1. **Super Admin** - Platform owner, manages all parking facilities
2. **Parking Admin** - Manages a specific parking facility
3. **Worker** - Registers entries/exits of vehicles at a parking facility
4. **Public User** - Views available parking spots and pricing (no login required)

## Core Flow

```
Vehicle arrives -> Worker enters license plate -> Spot marked occupied
Vehicle leaves -> Worker searches by plate -> System calculates cost -> Payment -> Spot freed
```

## Database Schema (PostgreSQL recommended for MVP)

### Tables

```sql
-- Platform users (login system)
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role ENUM('super_admin', 'parking_admin', 'worker'),
  name VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Parking facilities
parking_facilities (
  id UUID PRIMARY KEY,
  name VARCHAR,
  address VARCHAR,
  description TEXT,
  total_spots INTEGER,
  owner_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Pricing configuration
pricing_config (
  id UUID PRIMARY KEY,
  parking_id UUID REFERENCES parking_facilities(id),
  price_per_minute DECIMAL,
  price_per_hour DECIMAL,
  price_per_day DECIMAL,
  price_per_month DECIMAL,
  billing_mode ENUM('minute', 'hour', 'day', 'month'),
  updated_at TIMESTAMP
)

-- Parking spots (optional, for granular tracking)
parking_spots (
  id UUID PRIMARY KEY,
  parking_id UUID REFERENCES parking_facilities(id),
  spot_number VARCHAR,
  is_occupied BOOLEAN DEFAULT false,
  current_vehicle_id UUID REFERENCES vehicles(id)
)

-- Vehicles (tracked by license plate)
vehicles (
  id UUID PRIMARY KEY,
  license_plate VARCHAR,
  parking_id UUID REFERENCES parking_facilities(id),
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  spot_id UUID REFERENCES parking_spots(id),
  status ENUM('parked', 'completed', 'no_show'),
  registered_by UUID REFERENCES users(id)
)

-- Transactions/Payments
transactions (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  amount DECIMAL,
  duration_minutes INTEGER,
  payment_method VARCHAR,
  paid_at TIMESTAMP,
  created_by UUID REFERENCES users(id)
)

-- Workers assigned to parking facilities
parking_workers (
  id UUID PRIMARY KEY,
  parking_id UUID REFERENCES parking_facilities(id),
  user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP
)
```

## API Endpoints (REST)

### Public
- `GET /api/parkings` - List all active parking facilities with availability
- `GET /api/parkings/:id` - Get parking details and current pricing

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`

### Admin (Parking Admin + Workers)
- `GET /api/parkings/:id/availability` - Real-time available spots
- `PUT /api/parkings/:id/config` - Update pricing and total spots
- `POST /api/parkings/:id/workers` - Register a worker
- `GET /api/parkings/:id/workers` - List workers

### Vehicle Management
- `POST /api/parkings/:id/vehicles/entry` - Register vehicle entry (license plate)
- `GET /api/parkings/:id/vehicles/:plate` - Search vehicle by plate
- `POST /api/parkings/:id/vehicles/:plate/exit` - Process exit and calculate cost
- `POST /api/transactions/pay` - Process payment and free spot

## Development Phases

### Phase 1: Foundation & Auth (Week 1-2)
- Project setup (Next.js + TypeScript + PostgreSQL + Prisma)
- Database schema with Prisma migrations
- Authentication system (JWT or NextAuth)
- User roles and permissions
- Basic layout and navigation

### Phase 2: Parking Management (Week 2-3)
- CRUD for parking facilities
- Pricing configuration (per minute/hour/day/month)
- Total spots management
- Real-time availability display (public page)

### Phase 3: Vehicle Tracking (Week 3-4)
- Vehicle entry by license plate
- Occupancy tracking
- Vehicle search by plate
- Exit processing with cost calculation
- Payment recording

### Phase 4: Worker Management (Week 4)
- Register workers to parking facilities
- Worker dashboard (simplified view)
- Activity log

### Phase 5: Dashboard & Real-time (Week 5)
- Admin dashboard with statistics
- Real-time updates (WebSockets or Server-Sent Events)
- Historical reports

### Phase 6: Polish & MVP Launch (Week 5-6)
- Responsive design
- Error handling and validation
- Testing
- Deployment

## Tech Stack Recommendations

- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes or Server Actions
- **Database**: PostgreSQL (Supabase or Neon for easy setup)
- **ORM**: Prisma
- **Auth**: NextAuth.js or Lucia Auth
- **Real-time**: Server-Sent Events (simpler) or WebSockets
- **Deployment**: Vercel (frontend + API) + Supabase/Neon (DB)

## Key Business Rules

1. Cost calculation: `duration * rate` based on billing_mode
2. Cannot exceed total_spots capacity
3. Only authenticated workers can register entries/exits
4. License plate must be unique per active parking session
5. Payment required before spot is freed
6. Historical data retained for reporting

## MVP Scope (Minimum)

- Single parking facility management
- License plate entry/exit
- Cost calculation by hour (simplest billing mode first)
- Basic admin dashboard
- Public availability page
- Worker registration

## File Conventions

- Components: PascalCase, in `components/`
- Pages/Routes: kebab-case, in `app/`
- API routes: in `app/api/`
- Utils: camelCase, in `lib/`
- Types: PascalCase, in `types/`
- Prisma schema: `prisma/schema.prisma`
