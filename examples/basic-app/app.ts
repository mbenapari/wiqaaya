import express from "express"

import {
  wiqaaya,
  secureRoute,
  wiqaayaErrorHandler,
  WiqaayaAdapter
} from "@wiqaaya/core"

const app = express()
app.use(express.json())

// --- MOCK ADAPTER (for demo; swap with sequelizeAdapter for production) ---
const mockAdapter: WiqaayaAdapter = {
  transaction: {
    async begin() {
      return { txId: Math.random() }
    },
    async commit() {},
    async rollback() {}
  },
  idempotency: {
    async find() {
      return null // no stored idempotency
    },
    async insert() {
      // no-op
    },
    async delete() {
      // no-op
    }
  },
  audit: {
    async insert() {
      // no-op; in production, this persists to the audit table
    }
  },
  isUniqueConstraintError() {
    return false
  }
}

// --- IN-MEMORY PAYMENT STORE (for demo) ---
let paymentId = 0
const payments: Record<number, { id: number; amount: number }> = {}

// --- WIQAAYA INIT ---
wiqaaya({
  adapter: mockAdapter,
  strictMode: true,
  idempotency: {
    enabled: true,
    ttl: 3600
  }
})

// --- Fake Auth Middleware ---
app.use((req: any, _res, next) => {
  // Simulate logged-in merchant
  req.user = {
    id: 1,
    roles: ["merchant"]
  }
  next()
})

// --- ROUTE ---
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
      const { amount } = req.body

      // Store payment in memory (for demo)
      const id = ++paymentId
      payments[id] = { id, amount }

      // Log audit event
      ctx.audit.log({
        action: "CREATE_PAYMENT",
        metadata: { amount }
      })

      return {
        id,
        amount,
        message: "Payment created (mock adapter, in-memory storage)"
      }
    }
  )
)

// --- ERROR HANDLER ---
app.use(wiqaayaErrorHandler)

// --- START ---
async function start() {
  app.listen(3000, () =>
    console.log("🚀 Server running on http://localhost:3000")
  )
}

start()