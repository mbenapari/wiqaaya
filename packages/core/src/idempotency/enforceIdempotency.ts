import type { Request } from "express"
import type { InternalConfig } from "../types/InternalConfig"
import type { WiqaayaContext } from "../context/WiqaayaContext"
import { WiqaayaError } from "../errors/WiqaayaError"
import { hashRequest } from "./hashRequest"

export async function enforceIdempotency<TUser>(
  req: Request,
  ctx: WiqaayaContext<TUser>,
  config: InternalConfig
) {
  if (!config.idempotency.enabled) {
    return null
  }

  const key = req.headers[
    config.idempotency.headerName.toLowerCase()
  ] as string | undefined

  if (!key) {
    throw new WiqaayaError(
      "Idempotency key required",
      "WIQ_400_IDEMPOTENCY_KEY_REQUIRED",
      400
    )
  }

  const requestHash = hashRequest(req)

  const existing = await config.adapter.idempotency.find(key)

  if (existing) {
    const now = Date.now()
    const createdAt = new Date(
      (existing as any).createdAt
    ).getTime()

    const ageSeconds = (now - createdAt) / 1000

    if (ageSeconds > config.idempotency.ttl) {
      // Expired — delete and treat as fresh
      if (config.adapter.idempotency.delete) {
        await config.adapter.idempotency.delete(key)
      }
    } else {
      if (existing.requestHash !== requestHash) {
        throw new WiqaayaError(
          "Idempotency key reuse with different payload",
          "WIQ_409_IDEMPOTENCY_CONFLICT",
          409
        )
      }

      ctx.idempotency = {
        key,
        requestHash,
        replayed: true
      }

      return existing
    }
  }

  ctx.idempotency = {
    key,
    requestHash,
    replayed: false
  }

  return null
}