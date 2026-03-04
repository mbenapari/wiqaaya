import express from "express"
import { Sequelize, DataTypes } from "sequelize"

import {
  wiqaaya,
  secureRoute,
  wiqaayaErrorHandler
} from "@wiqaaya/core"

import { sequelizeAdapter } from "@wiqaaya/adapter-sequelize"

const app = express()
app.use(express.json())

// --- DATABASE ---
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:"
})

// Example payment model
const Payment = sequelize.define("Payment", {
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})

// --- WIQAAYA INIT ---
wiqaaya({
  adapter: sequelizeAdapter(sequelize),
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

      const payment = await Payment.create(
        { amount },
        { transaction: ctx.transaction as any }
      )

      ctx.audit.log({
        action: "CREATE_PAYMENT",
        metadata: { amount }
      })

      return {
        id: payment.get("id"),
        amount
      }
    }
  )
)

// --- ERROR HANDLER ---
app.use(wiqaayaErrorHandler)

// --- START ---
async function start() {
  await sequelize.sync()
  app.listen(3000, () =>
    console.log("Server running on port 3000")
  )
}

start()