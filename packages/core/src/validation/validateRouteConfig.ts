import type { RouteConfig } from "../types/RouteConfig"
import { WiqaayaError } from "../errors/WiqaayaError"
import { validateRouteMatrix } from "./routeMatrix"

export function validateRouteConfig(
  route: RouteConfig,
  strictMode: boolean
) {
  if (!route.method) {
    throw new WiqaayaError(
      "Route method is required",
      "WIQ_400_ROUTE_CONFIG",
      400
    )
  }

  if (route.roles && !route.requireAuth) {
    throw new WiqaayaError(
      "roles cannot be defined when requireAuth is false",
      "WIQ_400_ROUTE_CONFIG",
      400
    )
  }

  validateRouteMatrix(route, strictMode)
}