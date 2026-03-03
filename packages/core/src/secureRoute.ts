import { validateRouteConfig } from "./validation/validateRouteConfig";
import type { Request, Response, NextFunction } from "express";
import type { RouteConfig } from "./types/RouteConfig";
import type { WiqaayaContext } from "./context/WiqaayaContext";
import { getInternalConfig } from "./wiqaaya";
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from "./lifecycle/transactionManager";
import { enforceAuth } from "./security/enforceAuth";
import { enforceIdempotency } from "./idempotency/enforceIdempotency";
import { createAuditLogger } from "./audit/createAuditLogger";

export function secureRoute<TResponse = any, TUser = any>(
  routeConfig: RouteConfig,
  handler: (req: Request, ctx: WiqaayaContext<TUser>) => Promise<TResponse>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const config = getInternalConfig();
    const adapter = config.adapter;

    validateRouteConfig(routeConfig, config.strictMode);
    let transaction: unknown | undefined;

    try {
      const ctx: WiqaayaContext<TUser> = {
        user: (req as any)[config.userProperty],
        tenantId: req.headers["x-tenant-id"] as string | undefined,
        transaction: undefined,
        audit: { log: () => {} },
      };

      const auditLogger = createAuditLogger(ctx, config);

      enforceAuth(routeConfig, ctx);

      // --- IDEMPOTENCY CHECK ---
      let replayedResponse = null;

      if (routeConfig.idempotent) {
        replayedResponse = await enforceIdempotency(req, ctx, config);

        if (replayedResponse) {
          return res
            .status(replayedResponse.statusCode)
            .json(replayedResponse.response);
        }
      }

      // Begin transaction if required
      if (routeConfig.transactional) {
        transaction = await beginTransaction(adapter);
        ctx.transaction = transaction;
      }
      const result = await handler(req, ctx);

      // Commit if transaction exists
      if (transaction) {
        await commitTransaction(adapter, transaction);
      }

      // --- STORE IDEMPOTENT RESULT ---
      if (routeConfig.idempotent && ctx.idempotency) {
        await adapter.idempotency.insert({
          key: ctx.idempotency.key,
          requestHash: ctx.idempotency.requestHash,
          response: result,
          statusCode: 200,
        });
      }

      await auditLogger.flush(transaction);

      res.json(result);
    } catch (err) {
      // Rollback if transaction exists
      if (transaction) {
        try {
          await rollbackTransaction(adapter, transaction);
        } catch {
          // swallow rollback failure
        }
      }

      next(err);
    }
  };
}
