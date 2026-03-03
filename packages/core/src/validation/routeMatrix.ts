import type { RouteConfig } from "../types/RouteConfig"

export function validateRouteMatrix(
  route: RouteConfig,
  strictMode: boolean
) {
  const { method, transactional, idempotent } = route

  // GET rules
  if (method === "GET") {
    if (transactional && strictMode) {
      throw new Error(
        "GET routes cannot be transactional in strictMode"
      )
    }

    if (idempotent && strictMode) {
      throw new Error(
        "GET routes cannot be idempotent in strictMode"
      )
    }
  }

  // Mutating routes
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (idempotent && method !== "POST") {
      throw new Error(
        "Only POST routes may be idempotent"
      )
    }
  }
}