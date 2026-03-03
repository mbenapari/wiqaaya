import type { WiqaayaAdapter } from "../adapters/AdapterTypes"

export interface WiqaayaConfig {
  adapter: WiqaayaAdapter

  strictMode?: boolean
  financialMode?: boolean
  multiTenant?: boolean

  idempotency?: {
    enabled: boolean
    ttl: number
    headerName?: string
  }

  userProperty?: string
}