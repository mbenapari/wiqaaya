import type { WiqaayaConfig } from "./WiqaayaConfig"

export interface InternalConfig extends Required<WiqaayaConfig> {
  idempotency: {
    enabled: boolean
    ttl: number
    headerName: string
  }

  userProperty: string
}