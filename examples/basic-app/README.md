# Basic Wiqaaya Example App

This is a minimal Express app demonstrating Wiqaaya's core features:

- **Transactional routes** — automatic transaction management
- **Idempotency** — request deduplication with `x-idempotency-key`
- **Audit logging** — structured event tracking
- **Error handling** — standardized error responses

---

## 🚀 Run

```bash
pnpm dev
```

Server starts on `http://localhost:3000`.

---

## 📝 API

### POST /payments

Create a payment (requires idempotency key).

**Request:**
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: unique-key-123" \
  -d '{"amount": 100}'
```

**Response:**
```json
{
  "id": 1,
  "amount": 100,
  "message": "Payment created (mock adapter, in-memory storage)"
}
```

**Without idempotency key:** Returns 400 error (Wiqaaya enforces it).

```json
{
  "success": false,
  "error": {
    "code": "WIQ_400_IDEMPOTENCY_KEY_REQUIRED",
    "message": "Idempotency key required"
  }
}
```

---

## 🔧 Setup

### Current: Mock Adapter (Demo)

Uses an in-memory adapter and payment store. No database required.

### Production: Sequelize Adapter

To use a real database:

1. **Install sqlite3** (or your DB driver):
   ```bash
   pnpm add -D sqlite3
   ```

2. **Replace mock adapter** in `app.ts`:
   ```ts
   import { sequelizeAdapter } from "@wiqaaya/adapter-sequelize"
   import { Sequelize } from "sequelize"
   
   const sequelize = new Sequelize({
     dialect: "sqlite",
     storage: ":memory:"
   })
   
   const mockAdapter = sequelizeAdapter(sequelize)
   ```

3. **Replace in-memory payment store** with Sequelize model:
   ```ts
   import { DataTypes } from "sequelize"
   
   const Payment = sequelize.define("Payment", {
     amount: { type: DataTypes.INTEGER, allowNull: false }
   })
   ```

4. **Update start function**:
   ```ts
   async function start() {
     await sequelize.sync()
     app.listen(3000, ...)
   }
   ```

---

## 🛡 Key Features Demonstrated

- **`wiqaaya(config)`** — Initialize Wiqaaya once per app
- **`secureRoute(routeConfig, handler)`** — Wrap routes to enforce rules
- **`transactional: true`** — Auto transaction + rollback on error
- **`idempotent: true`** — Require and cache `x-idempotency-key`
- **`ctx.audit.log()`** — Record audit events
- **`wiqaayaErrorHandler`** — Normalize error responses

---

## 📚 Learn More

See the [main README](../../README.md) for full API docs and philosophy.
