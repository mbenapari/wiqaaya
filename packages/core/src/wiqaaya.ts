import type { WiqaayaConfig } from "./types/WiqaayaConfig"
import type { InternalConfig } from "./types/InternalConfig"
import { resolveConfig } from "./config/resolveConfig"
import { validateAdapter } from "./config/validateAdapter"
import { WiqaayaError } from "./errors/WiqaayaError"

let internalConfig: InternalConfig | null = null

export function wiqaaya(userConfig: WiqaayaConfig) {
  if (internalConfig) {
    throw new WiqaayaError(
      "Wiqaaya already initialized",
      "WIQ_500_CONFIG",
      500
    )
  }

  const resolved = resolveConfig(userConfig)

  validateAdapter(resolved.adapter)

  internalConfig = Object.freeze(resolved)
}

export function getInternalConfig(): InternalConfig {
  if (!internalConfig) {
    throw new WiqaayaError(
      "Wiqaaya not initialized. Call wiqaaya() first.",
      "WIQ_500_CONFIG",
      500
    )
  }

  return internalConfig
}