# EstacionamientosApp - Marketplace de Estacionamientos

## Visión General

Marketplace web donde estacionamientos (oficiales o privados) se registran, pagan suscripción, y muestran en tiempo real:
- Cantidad de estacionamientos disponibles
- Tarifas por minuto, hora, día o mes
- Vehículos abonados/frecuentes

---

## Decisiones de Negocio (Definidas)

| Pregunta | Decisión |
|----------|----------|
| Visibilidad pública | Todos los estacionamientos que el admin marque como "públicos" |
| Suscripción | Los admins pagan suscripción para usar la plataforma |
| Moneda | Peso Chileno (CLP) - MVP Chile |
| Reservas | Solo si el admin habilita spots para reserva |
| Notificaciones | Sí, enviar cuando estacionamiento está lleno |
| Comprobante | Sí, imprimir ticket/comprobante de pago |
| Abonados | Sí, vehículos frecuentes con pago mensual fijo |

---

## Actores del Sistema

| Rol | Descripción |
|-----|-------------|
| **Super Admin** | Dueño de la plataforma, gestiona suscripciones y estacionamientos |
| **Admin Estacionamiento** | Gestiona su estacionamiento (configuración, precios, trabajadores, abonados) |
| **Trabajador** | Registra entrada/salida de vehículos |
| **Abonado** | Vehículo frecuente con pago mensual, no paga por entrada individual |
| **Público** | Ve estacionamientos disponibles y precios (sin login) |

---

## Flujo Principal

```
Vehículo llega → Trabajador ingresa patente
                      ↓
          ¿Es abonado?
          ├─ SÍ → Registra entrada (sin cobro) → Ocupa lugar
          └─ NO → Registra entrada → Ocupa lugar
                      ↓
Vehículo se va → Busca por patente
                      ↓
          ¿Es abonado?
          ├─ SÍ → Libera lugar (sin cobro)
          └─ NO → Calcula costo → Pago → Comprobante → Libera lugar
```

---

## Sprint MVP - 1 Semana (7 días)

### Día 1: Setup + Auth + DB

**Objetivo:** Proyecto corriendo con login y base de datos

- [ ] Init Next.js 14 + TypeScript + TailwindCSS
- [ ] PostgreSQL local (Docker o Supabase local)
- [ ] Prisma schema + migración inicial
- [ ] Auth con NextAuth (credentials)
- [ ] Roles: super_admin, parking_admin, worker
- [ ] Seed con usuario admin de prueba
- [ ] Layout base + páginas de login/register

**Entregable:** App corriendo en localhost con login funcional

---

### Día 2: Estacionamientos + Precios + Marketplace Público

**Objetivo:** Admin crea estacionamiento + página pública tipo marketplace

- [ ] CRUD estacionamiento (nombre, dirección, descripción, is_public)
- [ ] total_spots + reserved_spots
- [ ] Configuración de precios (min/hora/día/mes en CLP)
- [ ] Página pública `/` tipo marketplace: lista todos los públicos
- [ ] Cards con: nombre, dirección, disponibles, precio desde
- [ ] Página detalle `/parking/[id]` con info completa

**Entregable:** Marketplace público visible + admin configura estacionamiento

---

### Día 3: Control de Vehículos + Entrada/Salida

**Objetivo:** Flujo completo de entrada y salida

- [ ] Dashboard del estacionamiento (vista worker)
- [ ] Registrar entrada por patente
- [ ] Validar disponibilidad
- [ ] Detectar si es abonado automáticamente
- [ ] Buscar vehículo activo por patente
- [ ] Procesar salida con cálculo de costo
- [ ] Liberar lugar

**Entregable:** Entrada → estadía → salida funcionando

---

### Día 4: Pagos + Comprobante + Abonados

**Objetivo:** Cobro, ticket y gestión de abonados

- [ ] Registrar pago (efectivo/transferencia/tarjeta)
- [ ] Generar comprobante imprimible (ventana print)
- [ ] CRUD abonados (registrar patente, monto mensual, vigencia)
- [ ] Al entrar abonado: no cobra, solo registra
- [ ] Indicador visual en dashboard si vehículo es abonado

**Entregable:** Pagos + tickets + sistema de abonados

---

### Día 5: Trabajadores + Notificaciones + Suscripción

**Objetivo:** Gestión de equipo, alertas y control de acceso

- [ ] CRUD trabajadores (asignar a estacionamiento)
- [ ] Notificación cuando estacionamiento llega a 0 disponibles
- [ ] Control de suscripción (activo/inactivo)
- [ ] Si suscripción inactiva → bloquear operaciones
- [ ] Log de actividad (quién hizo qué)

**Entregable:** Sistema completo de gestión operativa

---

### Día 6: Dashboard + Tiempo Real + Polish

**Objetivo:** Dashboard con stats y actualización en vivo

- [ ] Dashboard admin con estadísticas del día
- [ ] Ocupados vs disponibles (actualización automática)
- [ ] Ingresos del día
- [ ] Historial de vehículos del día
- [ ] SSE para actualización en tiempo real
- [ ] Diseño responsive básico
- [ ] Validación de formularios

**Entregable:** Dashboard profesional con datos en vivo

---

### Día 7: Testing + Deploy + Bug Fix

**Objetivo:** MVP en producción

- [ ] Tests manuales de flujos críticos
- [ ] Fix de bugs encontrados
- [ ] Deploy a Vercel
- [ ] Base de datos en producción (Supabase free tier)
- [ ] Variables de entorno configuradas
- [ ] Demo funcional lista

**Entregable:** MVP desplegado y funcional en producción

---

## Modelo de Base de Datos

```sql
-- Usuarios de la plataforma
users (
  id              UUID PRIMARY KEY,
  email           VARCHAR UNIQUE NOT NULL,
  password_hash   VARCHAR NOT NULL,
  role            VARCHAR NOT NULL, -- super_admin, parking_admin, worker
  name            VARCHAR NOT NULL,
  phone           VARCHAR,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Suscripciones de admins
subscriptions (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  plan_type       VARCHAR NOT NULL, -- basic, premium
  status          VARCHAR NOT NULL DEFAULT 'active', -- active, expired, cancelled
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  amount_clp      INTEGER NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Estacionamientos
parking_facilities (
  id              UUID PRIMARY KEY,
  name            VARCHAR NOT NULL,
  address         VARCHAR NOT NULL,
  description     TEXT,
  total_spots     INTEGER NOT NULL DEFAULT 0,
  reserved_spots  INTEGER NOT NULL DEFAULT 0,
  owner_id        UUID REFERENCES users(id),
  is_public       BOOLEAN DEFAULT true,
  is_active       BOOLEAN DEFAULT true,
  latitude        DECIMAL,
  longitude       DECIMAL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Configuración de precios
pricing_config (
  id                  UUID PRIMARY KEY,
  parking_id          UUID REFERENCES parking_facilities(id) UNIQUE,
  price_per_minute    INTEGER, -- en CLP
  price_per_hour      INTEGER, -- en CLP
  price_per_day       INTEGER, -- en CLP
  price_per_month     INTEGER, -- en CLP
  billing_mode        VARCHAR NOT NULL DEFAULT 'hour', -- minute, hour, day, month
  updated_at          TIMESTAMP DEFAULT NOW()
)

-- Lugares individuales (opcional, para control granular)
parking_spots (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  spot_number     VARCHAR NOT NULL,
  is_reserved     BOOLEAN DEFAULT false,
  is_occupied     BOOLEAN DEFAULT false,
  UNIQUE(parking_id, spot_number)
)

-- Abonados (vehículos frecuentes)
subscribers (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  license_plate   VARCHAR NOT NULL,
  owner_name      VARCHAR,
  owner_phone     VARCHAR,
  monthly_fee_clp INTEGER NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(parking_id, license_plate)
)

-- Vehículos en estacionamiento (sesiones activas e históricas)
vehicles (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  license_plate   VARCHAR NOT NULL,
  entry_time      TIMESTAMP NOT NULL DEFAULT NOW(),
  exit_time       TIMESTAMP,
  spot_id         UUID REFERENCES parking_spots(id),
  is_subscriber   BOOLEAN DEFAULT false,
  is_reservation  BOOLEAN DEFAULT false,
  status          VARCHAR NOT NULL DEFAULT 'parked', -- parked, completed, no_show
  registered_by   UUID REFERENCES users(id),
  notes           TEXT
)

-- Transacciones / Pagos
transactions (
  id              UUID PRIMARY KEY,
  vehicle_id      UUID REFERENCES vehicles(id),
  amount_clp      INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  payment_method  VARCHAR NOT NULL, -- cash, transfer, card
  paid_at         TIMESTAMP DEFAULT NOW(),
  receipt_number  VARCHAR UNIQUE NOT NULL,
  created_by      UUID REFERENCES users(id)
)

-- Trabajadores asignados
parking_workers (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  user_id         UUID REFERENCES users(id),
  assigned_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(parking_id, user_id)
)

-- Notificaciones
notifications (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  type            VARCHAR NOT NULL, -- full, subscription_warning, etc
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Log de actividad
activity_log (
  id              UUID PRIMARY KEY,
  parking_id      UUID REFERENCES parking_facilities(id),
  user_id         UUID REFERENCES users(id),
  action          VARCHAR NOT NULL,
  details         JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

---

## Stack Tecnológico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | Next.js 14 (App Router) + React + TailwindCSS | Rápido, SSR, fullstack |
| Backend | Next.js Server Actions | Sin API routes separadas |
| Base de Datos | PostgreSQL (Supabase free) | Gratis, fácil deploy |
| ORM | Prisma | Type-safe, migraciones |
| Auth | NextAuth.js v5 | Probado, flexible |
| Tiempo Real | SSE (Server-Sent Events) | Más simple que WebSockets |
| Deploy | Vercel (free tier) | Zero config, CI/CD |
| UI Components | shadcn/ui | Rápido, bonito, custom |

---

## Alcance del MVP

### INCLUÍDO:
1. Marketplace público con estacionamientos disponibles
2. Registro de entrada/salida por patente
3. Cálculo de costo (min/hora/día/mes) en CLP
4. Sistema de abonados (no pagan por entrada)
5. Dashboard admin con stats en tiempo real
6. Comprobante imprimible
7. Notificación cuando está lleno
8. Gestión de trabajadores
9. Control de suscripción del admin
10. Página pública tipo marketplace

### FUERA DEL MVP (post-lanzamiento):
- Pagos online de suscripción (Webpay/Flow)
- Reservas anticipadas
- Reportes avanzados con gráficos
- App móvil
- Múltiples monedas
- Integración con cámaras/LPR
- API pública

---

## Reglas de Negocio

1. Costo = `duración × tarifa` según billing_mode (CLP)
2. No exceder `total_spots`
3. Patente única por sesión activa
4. Solo auth (worker/admin) registra entradas/salidas
5. Pago obligatorio antes de liberar (excepto abonados)
6. Abonados entran/salen sin cobro individual
7. Suscripción activa requerida para operar
8. Solo `is_public = true` aparece en marketplace
9. Notificación automática cuando `available == 0`
10. Comprobante con número único consecutivo
11. Formato patente chilena: ABCD12 o AB·CD-12

---

## API Endpoints (Server Actions)

```
// Auth
action: login(email, password)
action: logout()
action: register(name, email, password, role)

// Parking
action: createParking(data)
action: updateParking(id, data)
action: togglePublic(id)
action: updatePricing(parkingId, pricing)

// Vehicles
action: registerEntry(parkingId, licensePlate)
action: searchVehicle(parkingId, licensePlate)
action: processExit(vehicleId, paymentMethod)

// Subscribers
action: registerSubscriber(parkingId, data)
action: updateSubscriber(id, data)
action: deactivateSubscriber(id)

// Workers
action: assignWorker(parkingId, userId)
action: removeWorker(parkingId, userId)

// Subscription
action: activateSubscription(userId, planType, months)
action: checkSubscription(userId)

// Public
query: getPublicParkings()
query: getParkingDetail(id)
query: getAvailability(id)
```

---

## Estructura del Proyecto

```
estacionamientosapp/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (public)/
│   │   ├── page.tsx                    # Marketplace
│   │   └── parking/[id]/page.tsx       # Detalle público
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx                # Dashboard principal
│   │   │   ├── parking/page.tsx        # Config estacionamiento
│   │   │   ├── pricing/page.tsx        # Config precios
│   │   │   ├── workers/page.tsx        # Gestión trabajadores
│   │   │   ├── subscribers/page.tsx    # Gestión abonados
│   │   │   └── subscription/page.tsx   # Mi suscripción
│   │   └── operations/
│   │       ├── page.tsx                # Panel de operaciones
│   │       ├── entry/page.tsx          # Registrar entrada
│   │       └── exit/page.tsx           # Procesar salida
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── sse/route.ts                # Server-Sent Events
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn components
│   ├── marketplace/
│   │   ├── ParkingCard.tsx
│   │   └── ParkingList.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── AvailabilityChart.tsx
│   │   └── RecentActivity.tsx
│   └── operations/
│       ├── EntryForm.tsx
│       ├── ExitForm.tsx
│       └── Receipt.tsx
├── lib/
│   ├── db.ts                           # Prisma client
│   ├── auth.ts                         # NextAuth config
│   ├── actions/                        # Server actions
│   │   ├── auth.ts
│   │   ├── parking.ts
│   │   ├── vehicles.ts
│   │   ├── subscribers.ts
│   │   └── transactions.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts
└── .env
```

---

## Plan de Deploy

1. **DB:** Supabase free tier (PostgreSQL)
2. **App:** Vercel free tier
3. **Dominio:** Subdominio vercel.app (luego custom)
4. **Env vars:** DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

---

## Riesgos y Mitigación

| Riesgo | Mitigación |
|--------|-----------|
| 7 días es poco | Priorizar core: entrada/salida/pago primero |
| SSE complejo | Fallback a polling cada 5s si no da tiempo |
| Auth complejo | Usar NextAuth con credentials, simple |
| Print complicado | window.print() con CSS @media print |

---

## Checklist de Lanzamiento

- [ ] Login funciona
- [ ] Admin crea estacionamiento
- [ ] Configura precios
- [ ] Página pública muestra estacionamientos
- [ ] Worker registra entrada
- [ ] Worker procesa salida con cobro
- [ ] Abonado entra sin cobro
- [ ] Comprobante se imprime
- [ ] Notificación cuando lleno
- [ ] Suscripción bloquea si expira
- [ ] Responsive en mobile
- [ ] Deploy en Vercel OK
- [ ] DB en producción OK
