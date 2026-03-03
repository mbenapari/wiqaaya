import { Sequelize, Transaction, UniqueConstraintError } from "sequelize";
import type { WiqaayaAdapter } from "@wiqaaya/core";
import { initIdempotencyModel, IdempotencyModel } from "./models/Idempotency";
import { initAuditModel, AuditModel } from "./models/Audit";

export function sequelizeAdapter(sequelize: Sequelize): WiqaayaAdapter {
  initIdempotencyModel(sequelize);
  initAuditModel(sequelize);
  return {
    transaction: {
      async begin() {
        return sequelize.transaction();
      },

      async commit(tx: unknown) {
        await (tx as Transaction).commit();
      },

      async rollback(tx: unknown) {
        await (tx as Transaction).rollback();
      },
    },

    idempotency: {
      async find(key: string) {
        const record = await IdempotencyModel.findByPk(key);

        if (!record) return null;

        return {
          key: record.key,
          requestHash: record.requestHash,
          response: record.response as unknown,
          statusCode: record.statusCode,
          createdAt: record.createdAt,
        };
      },

      async insert(data: { key: string; requestHash: string; response: unknown; statusCode: number }) {
        try {
          await IdempotencyModel.create({
            key: data.key,
            requestHash: data.requestHash,
            response: data.response as object,
            statusCode: data.statusCode,
          });
        } catch (error) {
          if (error instanceof UniqueConstraintError) {
            return;
          }
          throw error;
        }
      },

      async delete(key: string) {
        await IdempotencyModel.destroy({
          where: { key },
        });
      },
    },

    audit: {
      async insert(entry: { action: string; userId?: string | number; tenantId?: string; metadata?: Record<string, unknown>; createdAt: Date; transaction?: unknown }) {
        await AuditModel.create(
          {
            action: entry.action,
            userId: entry.userId?.toString(),
            tenantId: entry.tenantId,
            metadata: entry.metadata,
          },
          {
            transaction: entry.transaction as Transaction | undefined,
          },
        );
      },
    },

    isUniqueConstraintError(error: unknown): boolean {
      return error instanceof UniqueConstraintError;
    },
  };
}
