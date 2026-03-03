import type { RouteConfig } from "../types/RouteConfig"
import type { WiqaayaContext } from "../context/WiqaayaContext"
import { WiqaayaError } from "../errors/WiqaayaError"

export function enforceAuth<TUser>(
  route: RouteConfig,
  ctx: WiqaayaContext<TUser>
) {
  if (!route.requireAuth) {
    return
  }

  if (!ctx.user) {
    throw new WiqaayaError(
      "Authentication required",
      "WIQ_401_UNAUTHORIZED",
      401
    )
  }

  if (route.roles && route.roles.length > 0) {
    const userRoles = (ctx.user as any).roles

    if (!Array.isArray(userRoles)) {
      throw new WiqaayaError(
        "User roles not found",
        "WIQ_403_FORBIDDEN",
        403
      )
    }

    const hasRequiredRole = route.roles.some(role =>
      userRoles.includes(role)
    )

    if (!hasRequiredRole) {
      throw new WiqaayaError(
        "Insufficient permissions",
        "WIQ_403_FORBIDDEN",
        403
      )
    }
  }
}