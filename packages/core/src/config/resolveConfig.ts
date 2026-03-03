import type { WiqaayaConfig } from "../types/WiqaayaConfig"
import type { InternalConfig } from "../types/InternalConfig"
import { WiqaayaError } from "../errors/WiqaayaError"

export function resolveConfig(userConfig: WiqaayaConfig): InternalConfig {
  if (!userConfig.adapter) {
    throw new WiqaayaError(
      "Adapter is required",
      "WIQ_500_CONFIG",
      500
    )
  }

  const resolved: InternalConfig = {
    adapter: userConfig.adapter,
    strictMode: userConfig.strictMode ?? true,
    financialMode: userConfig.financialMode ?? false,
    multiTenant: userConfig.multiTenant ?? false,

    idempotency: {
      enabled: userConfig.idempotency?.enabled ?? false,
      ttl: userConfig.idempotency?.ttl ?? 86400,
      headerName:
        userConfig.idempotency?.headerName ?? "x-idempotency-key"
    },

    userProperty: userConfig.userProperty ?? "user"
  }

  return resolved
}