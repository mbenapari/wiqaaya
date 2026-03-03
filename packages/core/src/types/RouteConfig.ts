export interface RouteConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  requireAuth: boolean
  roles?: string[]

  transactional: boolean
  idempotent: boolean

  audit?: boolean
}