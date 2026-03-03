import crypto from "crypto"
import type { Request } from "express"

export function hashRequest(req: Request): string {
  const payload = JSON.stringify({
    method: req.method,
    path: req.originalUrl,
    body: req.body
  })

  return crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex")
}