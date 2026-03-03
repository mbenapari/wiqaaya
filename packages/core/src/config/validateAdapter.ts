import type { WiqaayaAdapter } from "../adapters/AdapterTypes"
import { WiqaayaError } from "../errors/WiqaayaError"

function assertFunction(fn: unknown, name: string) {
  if (typeof fn !== "function") {
    throw new WiqaayaError(
      `Adapter method missing: ${name}`,
      "WIQ_500_CONFIG",
      500
    )
  }
}

export function validateAdapter(adapter: WiqaayaAdapter) {
  if (!adapter) {
    throw new WiqaayaError(
      "Adapter is required",
      "WIQ_500_CONFIG",
      500
    )
  }

  assertFunction(adapter.transaction?.begin, "transaction.begin")
  assertFunction(adapter.transaction?.commit, "transaction.commit")
  assertFunction(adapter.transaction?.rollback, "transaction.rollback")

  assertFunction(adapter.idempotency?.find, "idempotency.find")
  assertFunction(adapter.idempotency?.insert, "idempotency.insert")

  assertFunction(adapter.audit?.insert, "audit.insert")

  assertFunction(
    adapter.isUniqueConstraintError,
    "isUniqueConstraintError"
  )
}