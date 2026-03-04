# 🛡 Wiqaaya

Wiqaaya (Arabic: وقاية — "Protection") is a financial‑grade request enforcement layer for Express applications. It centralizes transaction lifecycle management, idempotency enforcement, role‑based authorization, strict route validation, audit logging, and error normalization.

Designed for high‑integrity systems (fintech, payments, multi‑tenant APIs), Wiqaaya can also be applied to general Express apps that require strong structural guarantees.

---

## ✨ Philosophy

Controllers should contain business logic only. Wiqaaya enforces cross‑cutting concerns so controllers do not need to:

- Start/commit/rollback transactions
- Implement idempotency
- Check roles everywhere
- Manually structure error responses

---

## 📦 Packages (monorepo)

- `@wiqaaya/core` — core runtime, types, helpers
- `@wiqaaya/adapter-sequelize` — Sequelize adapter that persists idempotency and audit records

---

## 🚀 Quick install (workspace)

From the workspace root:

```bash
pnpm add @wiqaaya/core
pnpm add @wiqaaya/adapter-sequelize
```

Initialization (call once during app bootstrap):

```ts
import { wiqaaya } from "@wiqaaya/core"
import { sequelizeAdapter } from "@wiqaaya/adapter-sequelize"
import { Sequelize } from "sequelize"

const sequelize = new Sequelize("sqlite::memory:") // or your DB

wiqaaya({
  adapter: sequelizeAdapter(sequelize),
  strictMode: true,
  idempotency: { enabled: true, ttl: 86400 }
})
```

---

## 🔐 secureRoute — example

Wrap protected routes with `secureRoute`:

```ts
import { secureRoute } from "@wiqaaya/core"

app.post(
  "/payments",
  secureRoute(
    {
      method: "POST",
      requireAuth: true,
      roles: ["merchant"],
      transactional: true,
      idempotent: true
    },
    async (req, ctx) => {
      // business logic only
      return { success: true }
    }
  )
)
```

---

## 🔁 Idempotency

When a route is configured as idempotent:

- `x-idempotency-key` header is required
- Request hash is stored and compared
- Replayed requests return the cached response
- Conflicting key reuse returns HTTP 409
- TTL expiration supported

---

## 💳 Transaction lifecycle

When `transactional: true`:

- A transaction is started automatically and injected via `ctx.transaction`
- The transaction is committed on success and rolled back on error
- Controllers must not manage transactions manually

---

## 👤 Authentication & roles

Wiqaaya does not perform authentication. It enforces `requireAuth` and optional `roles` checks.

By default Wiqaaya expects the authenticated user on `req.user`. You can override the property with `userProperty` in configuration.

---

## 🧠 `WiqaayaContext` (shape)

```ts
export interface WiqaayaContext<UserType = any> {
  user?: UserType
  tenantId?: string
  transaction?: unknown

  idempotency?: {
    key: string
    requestHash: string
    replayed: boolean
  }

  audit: {
    log: (data: { action: string; metadata?: Record<string, unknown> }) => void
  }
}
```

---

## 📜 Audit logging

Use `ctx.audit.log({ action, metadata })` in controllers. Audit entries are buffered and persisted after a successful commit. The Sequelize adapter writes audits to the `wiqaaya_audit` table.

```ts
ctx.audit.log({ action: "CREATE_PAYMENT", metadata: { amount: 100 } })
```

---

## ❌ Error handling

Add the provided error handler middleware to normalize Wiqaaya errors:

```ts
import { wiqaayaErrorHandler } from "@wiqaaya/core"
app.use(wiqaayaErrorHandler)
```

Standard error response example:

```json
{
  "success": false,
  "error": { "code": "WIQ_403_FORBIDDEN", "message": "Insufficient permissions" }
}
```

---

## 🗄 Database (Sequelize)

- Idempotency table: `wiqaaya_idempotency`
- Audit table: `wiqaaya_audit`

Use migrations in production.

---

## 📌 `strictMode`

When `strictMode: true`, Wiqaaya enforces conservative rules (recommended for financial systems):

- `GET` cannot be transactional
- Only `POST` may be idempotent
- Roles require `requireAuth: true`

---

## 🧩 Adapter system

Wiqaaya is adapter‑driven. Current adapter: `@wiqaaya/adapter-sequelize` (Sequelize).

Planned adapters: MySQL, Prisma (optional), and custom adapters.

---

## ✅ README status

- Public API matches implementation
- No fictional features
- Roadmap aligned with earlier plan

---

## 🔒 What we do NOT do now

We intentionally avoid:

- Adding unrelated new features
- Adding Prisma or other major adapters immediately
- Implementing multi‑tenant enforcement yet
- Changing core contracts

---

Next step: create a minimal example app using Wiqaaya and validate runtime integration.
