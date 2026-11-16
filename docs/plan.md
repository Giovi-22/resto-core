# 🍽️ GastroManager — Plan de Arquitectura

> Sistema de gestión gastronómica tipo FUDO, construido con NestJS + PostgreSQL + React.

---

## Stack Tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| **Backend** | NestJS + TypeScript | Modular, escalable, opinionated |
| **ORM** | TypeORM | Integración nativa con NestJS, migraciones |
| **Base de datos** | PostgreSQL | Relacional, robusto, perfecto para restaurantes |
| **Validación** | class-validator + class-transformer | DTOs con validación automática |
| **Auth** | JWT + Passport.js | Stateless, escalable |
| **Docs** | Swagger / OpenAPI | Auto-generado desde decoradores |
| **Testing** | Jest + Supertest | Unit + E2E tests integrados con NestJS |
| **Frontend (backoffice)** | React + Vite + Material UI (MUI) | Componentes completos listos (DataGrid, formularios, modales, drawers). Sin diseñador dedicado, MUI resuelve el 80% del diseño de un sistema de gestión |
| **Frontend (carta online)** | Libre elección del developer (Tailwind recomendado) | La carta pública la construye el developer contratado por el restaurante — debe poder reflejar su branding propio |
| **Estado (FE)** | Zustand + React Query (TanStack Query) | Zustand para estado UI local, React Query para server state y cache |
| **Realtime** | WebSockets (Socket.io) | Pedidos en tiempo real |
| **Contenedores** | Docker + docker-compose | Dev/Prod parity |

---

## Dominio del Negocio — Módulos

```
gastroManager/
├── apps/
│   ├── api/          ← NestJS Backend
│   └── web/          ← React Frontend
└── libs/             ← Shared types (futuro monorepo)
```

### Módulos del Backend (orden de construcción)

| # | Módulo | Descripción | Prioridad |
|---|--------|-------------|-----------|
| 1 | **Core / Config** | Config global, DB, Swagger | 🔴 Ahora |
| 2 | **Auth** | Login, JWT, Roles | 🔴 Ahora |
| 3 | **Tenants / Restaurants** | Multi-tenant: cada restaurante es un "tenant" | 🔴 Ahora |
| 4 | **Users** | Usuarios por restaurante (dueño, mozo, caja) | 🔴 Ahora |
| 5 | **Menu / Products** | Categorías, productos, variantes, modificadores | 🟠 Fase 2 |
| 6 | **Tables** | Zonas, mesas, estados | 🟠 Fase 2 |
| 7 | **Orders** | Pedidos, ítems, estado del pedido | 🟠 Fase 2 |
| 8 | **Payments** | Medios de pago, cierres de caja | 🟡 Fase 3 |
| 9 | **Kitchen Display** | Sistema de cocina (WebSocket) | 🟡 Fase 3 |
| 10 | **Reports** | Ventas, productos más vendidos, etc. | 🟡 Fase 3 |
| 11 | **Inventory** | Stock, alertas de bajo stock | 🟢 Fase 4 |
| 12 | **Reservations** | Reservas de mesas | 🟢 Fase 4 |

---

## Entidades Principales

### `Restaurant` (Tenant)
- id, name, slug, address, phone, logo
- timezone, currency, taxRate
- isActive, createdAt, updatedAt

### `User`
- id, email, password (hashed), firstName, lastName
- role: `OWNER | MANAGER | WAITER | CASHIER | KITCHEN`
- restaurantId (FK)
- isActive, lastLogin

### `Zone` (Sector del salón)
- id, name, restaurantId
- description

### `Table`
- id, number, name, capacity
- zoneId, restaurantId
- status: `AVAILABLE | OCCUPIED | RESERVED | CLEANING`

### `Category` (Carta)
- id, name, description, imageUrl
- restaurantId, sortOrder, isActive

### `Product`
- id, name, description, imageUrl, price
- categoryId, restaurantId
- isAvailable, preparationTime

### `Modifier` / `ModifierGroup`
- Opciones de personalización (ej: "sin cebolla", "extra queso")

### `Order`
- id, number (secuencial por restaurante)
- tableId, restaurantId, waiterId
- status: `OPEN | SENT_TO_KITCHEN | READY | DELIVERED | PAID | CANCELLED`
- type: `DINE_IN | TAKEAWAY | DELIVERY`
- notes, createdAt, closedAt

### `OrderItem`
- id, orderId, productId
- quantity, unitPrice, notes
- status: `PENDING | IN_PROGRESS | READY | DELIVERED`
- modifiers (JSON)

### `Payment`
- id, orderId, amount, tip
- method: `CASH | CARD | TRANSFER | VOUCHER`
- receivedAt

### `CashRegister`
- id, restaurantId, openedById, closedById
- openedAt, closedAt, initialAmount, finalAmount

---

## Convenciones de Código

- **DTOs** siempre con `class-validator`
- **Guards**: `JwtAuthGuard` + `RolesGuard` en cada endpoint
- **Interceptors**: `ResponseInterceptor` para formato uniforme `{ data, meta }`
- **Filters**: `HttpExceptionFilter` global
- **Testing**: Cada servicio con unit tests (>80% coverage)
- **Migrations**: Nunca `synchronize: true` en producción
- **Env vars**: validadas con Joi al arrancar

---

## Plan de Construcción — Fase 1 (Hoy)

1. ✅ Crear proyecto NestJS con CLI
2. ✅ Configurar Docker + PostgreSQL
3. ✅ TypeORM + migraciones
4. ✅ Config module con Joi validation
5. ✅ Swagger
6. ✅ Módulo `Auth` (registro + login + JWT)
7. ✅ Módulo `Restaurants`
8. ✅ Módulo `Users`
9. ✅ Tests unitarios de cada servicio

---

## Estructura de Directorios del Backend

```
api/src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   └── database.config.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   └── strategies/
│   ├── restaurants/
│   ├── users/
│   ├── menu/
│   ├── tables/
│   ├── orders/
│   └── payments/
├── database/
│   └── migrations/
├── app.module.ts
└── main.ts
```
