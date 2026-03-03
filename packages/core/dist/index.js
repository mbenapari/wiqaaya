// src/errors/WiqaayaError.ts
var WiqaayaError = class extends Error {
  code;
  statusCode;
  details;
  constructor(message, code, statusCode, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
};

// src/config/resolveConfig.ts
function resolveConfig(userConfig) {
  if (!userConfig.adapter) {
    throw new WiqaayaError(
      "Adapter is required",
      "WIQ_500_CONFIG",
      500
    );
  }
  const resolved = {
    adapter: userConfig.adapter,
    strictMode: userConfig.strictMode ?? true,
    financialMode: userConfig.financialMode ?? false,
    multiTenant: userConfig.multiTenant ?? false,
    idempotency: {
      enabled: userConfig.idempotency?.enabled ?? false,
      ttl: userConfig.idempotency?.ttl ?? 86400,
      headerName: userConfig.idempotency?.headerName ?? "x-idempotency-key"
    },
    userProperty: userConfig.userProperty ?? "user"
  };
  return resolved;
}

// src/config/validateAdapter.ts
function assertFunction(fn, name) {
  if (typeof fn !== "function") {
    throw new WiqaayaError(
      `Adapter method missing: ${name}`,
      "WIQ_500_CONFIG",
      500
    );
  }
}
function validateAdapter(adapter) {
  if (!adapter) {
    throw new WiqaayaError(
      "Adapter is required",
      "WIQ_500_CONFIG",
      500
    );
  }
  assertFunction(adapter.transaction?.begin, "transaction.begin");
  assertFunction(adapter.transaction?.commit, "transaction.commit");
  assertFunction(adapter.transaction?.rollback, "transaction.rollback");
  assertFunction(adapter.idempotency?.find, "idempotency.find");
  assertFunction(adapter.idempotency?.insert, "idempotency.insert");
  assertFunction(adapter.audit?.insert, "audit.insert");
  assertFunction(
    adapter.isUniqueConstraintError,
    "isUniqueConstraintError"
  );
}

// src/wiqaaya.ts
var internalConfig = null;
function wiqaaya(userConfig) {
  if (internalConfig) {
    throw new WiqaayaError(
      "Wiqaaya already initialized",
      "WIQ_500_CONFIG",
      500
    );
  }
  const resolved = resolveConfig(userConfig);
  validateAdapter(resolved.adapter);
  internalConfig = Object.freeze(resolved);
}
function getInternalConfig() {
  if (!internalConfig) {
    throw new WiqaayaError(
      "Wiqaaya not initialized. Call wiqaaya() first.",
      "WIQ_500_CONFIG",
      500
    );
  }
  return internalConfig;
}

// src/validation/routeMatrix.ts
function validateRouteMatrix(route, strictMode) {
  const { method, transactional, idempotent } = route;
  if (method === "GET") {
    if (transactional && strictMode) {
      throw new Error(
        "GET routes cannot be transactional in strictMode"
      );
    }
    if (idempotent && strictMode) {
      throw new Error(
        "GET routes cannot be idempotent in strictMode"
      );
    }
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (idempotent && method !== "POST") {
      throw new Error(
        "Only POST routes may be idempotent"
      );
    }
  }
}

// src/validation/validateRouteConfig.ts
function validateRouteConfig(route, strictMode) {
  if (!route.method) {
    throw new WiqaayaError(
      "Route method is required",
      "WIQ_400_ROUTE_CONFIG",
      400
    );
  }
  if (route.roles && !route.requireAuth) {
    throw new WiqaayaError(
      "roles cannot be defined when requireAuth is false",
      "WIQ_400_ROUTE_CONFIG",
      400
    );
  }
  validateRouteMatrix(route, strictMode);
}

// src/lifecycle/transactionManager.ts
async function beginTransaction(adapter) {
  return adapter.transaction.begin();
}
async function commitTransaction(adapter, tx) {
  await adapter.transaction.commit(tx);
}
async function rollbackTransaction(adapter, tx) {
  await adapter.transaction.rollback(tx);
}

// src/security/enforceAuth.ts
function enforceAuth(route, ctx) {
  if (!route.requireAuth) {
    return;
  }
  if (!ctx.user) {
    throw new WiqaayaError(
      "Authentication required",
      "WIQ_401_UNAUTHORIZED",
      401
    );
  }
  if (route.roles && route.roles.length > 0) {
    const userRoles = ctx.user.roles;
    if (!Array.isArray(userRoles)) {
      throw new WiqaayaError(
        "User roles not found",
        "WIQ_403_FORBIDDEN",
        403
      );
    }
    const hasRequiredRole = route.roles.some(
      (role) => userRoles.includes(role)
    );
    if (!hasRequiredRole) {
      throw new WiqaayaError(
        "Insufficient permissions",
        "WIQ_403_FORBIDDEN",
        403
      );
    }
  }
}

// src/idempotency/hashRequest.ts
import crypto from "crypto";
function hashRequest(req) {
  const payload = JSON.stringify({
    method: req.method,
    path: req.originalUrl,
    body: req.body
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// src/idempotency/enforceIdempotency.ts
async function enforceIdempotency(req, ctx, config) {
  if (!config.idempotency.enabled) {
    return null;
  }
  const key = req.headers[config.idempotency.headerName.toLowerCase()];
  if (!key) {
    throw new WiqaayaError(
      "Idempotency key required",
      "WIQ_400_IDEMPOTENCY_KEY_REQUIRED",
      400
    );
  }
  const requestHash = hashRequest(req);
  const existing = await config.adapter.idempotency.find(key);
  if (existing) {
    const now = Date.now();
    const createdAt = new Date(
      existing.createdAt
    ).getTime();
    const ageSeconds = (now - createdAt) / 1e3;
    if (ageSeconds > config.idempotency.ttl) {
      if (config.adapter.idempotency.delete) {
        await config.adapter.idempotency.delete(key);
      }
    } else {
      if (existing.requestHash !== requestHash) {
        throw new WiqaayaError(
          "Idempotency key reuse with different payload",
          "WIQ_409_IDEMPOTENCY_CONFLICT",
          409
        );
      }
      ctx.idempotency = {
        key,
        requestHash,
        replayed: true
      };
      return existing;
    }
  }
  ctx.idempotency = {
    key,
    requestHash,
    replayed: false
  };
  return null;
}

// src/audit/createAuditLogger.ts
function createAuditLogger(ctx, config) {
  const buffer = [];
  ctx.audit.log = (data) => {
    buffer.push(data);
  };
  async function flush(transaction) {
    for (const entry of buffer) {
      try {
        await config.adapter.audit.insert({
          action: entry.action,
          userId: ctx.user?.id,
          tenantId: ctx.tenantId,
          metadata: entry.metadata,
          createdAt: /* @__PURE__ */ new Date(),
          transaction
        });
      } catch {
      }
    }
  }
  return { flush };
}

// src/secureRoute.ts
function secureRoute(routeConfig, handler) {
  return async (req, res, next) => {
    const config = getInternalConfig();
    const adapter = config.adapter;
    validateRouteConfig(routeConfig, config.strictMode);
    let transaction;
    try {
      const ctx = {
        user: req[config.userProperty],
        tenantId: req.headers["x-tenant-id"],
        transaction: void 0,
        audit: { log: () => {
        } }
      };
      const auditLogger = createAuditLogger(ctx, config);
      enforceAuth(routeConfig, ctx);
      let replayedResponse = null;
      if (routeConfig.idempotent) {
        replayedResponse = await enforceIdempotency(req, ctx, config);
        if (replayedResponse) {
          return res.status(replayedResponse.statusCode).json(replayedResponse.response);
        }
      }
      if (routeConfig.transactional) {
        transaction = await beginTransaction(adapter);
        ctx.transaction = transaction;
      }
      const result = await handler(req, ctx);
      if (transaction) {
        await commitTransaction(adapter, transaction);
      }
      if (routeConfig.idempotent && ctx.idempotency) {
        await adapter.idempotency.insert({
          key: ctx.idempotency.key,
          requestHash: ctx.idempotency.requestHash,
          response: result,
          statusCode: 200
        });
      }
      await auditLogger.flush(transaction);
      res.json(result);
    } catch (err) {
      if (transaction) {
        try {
          await rollbackTransaction(adapter, transaction);
        } catch {
        }
      }
      next(err);
    }
  };
}

// src/errors/normalizeError.ts
function normalizeError(error) {
  if (error instanceof WiqaayaError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  return {
    statusCode: 500,
    code: "WIQ_500_INTERNAL_ERROR",
    message: "Internal server error"
  };
}

// src/middleware/wiqaayaErrorHandler.ts
function wiqaayaErrorHandler(err, _req, res, _next) {
  const normalized = normalizeError(err);
  const isProduction = process.env.NODE_ENV === "production";
  const responseBody = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message
    }
  };
  if (!isProduction && normalized.details) {
    responseBody.error.details = normalized.details;
  }
  res.status(normalized.statusCode).json(responseBody);
}
export {
  WiqaayaError,
  getInternalConfig,
  secureRoute,
  wiqaaya,
  wiqaayaErrorHandler
};
