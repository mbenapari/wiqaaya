import type { InternalConfig } from "../types/InternalConfig"
import type { WiqaayaContext } from "../context/WiqaayaContext"

export function createAuditLogger<TUser>(
  ctx: WiqaayaContext<TUser>,
  config: InternalConfig
) {
  const buffer: Array<{
    action: string
    metadata?: Record<string, unknown>
  }> = []

  ctx.audit.log = (data) => {
    buffer.push(data)
  }

  async function flush(transaction?: unknown) {
    for (const entry of buffer) {
      try {
        await config.adapter.audit.insert({
          action: entry.action,
          userId: (ctx.user as any)?.id,
          tenantId: ctx.tenantId,
          metadata: entry.metadata,
          createdAt: new Date(),
          transaction
        })
      } catch {
        // fail-safe — audit failure never breaks request
      }
    }
  }

  return { flush }
}