// src/index.ts
import { UniqueConstraintError } from "sequelize";

// src/models/Idempotency.ts
import {
  DataTypes,
  Model
} from "sequelize";
var IdempotencyModel = class extends Model {
  key;
  requestHash;
  response;
  statusCode;
  createdAt;
  updatedAt;
};
function initIdempotencyModel(sequelize) {
  IdempotencyModel.init(
    {
      key: {
        type: DataTypes.STRING(255),
        primaryKey: true
      },
      requestHash: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      response: {
        type: DataTypes.JSON,
        allowNull: false
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: "wiqaaya_idempotency",
      timestamps: true
    }
  );
}

// src/models/Audit.ts
import {
  DataTypes as DataTypes2,
  Model as Model2
} from "sequelize";
var AuditModel = class extends Model2 {
  id;
  action;
  userId;
  tenantId;
  metadata;
  createdAt;
};
function initAuditModel(sequelize) {
  AuditModel.init(
    {
      id: {
        type: DataTypes2.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      action: {
        type: DataTypes2.STRING(255),
        allowNull: false
      },
      userId: {
        type: DataTypes2.STRING,
        allowNull: true
      },
      tenantId: {
        type: DataTypes2.STRING,
        allowNull: true
      },
      metadata: {
        type: DataTypes2.JSON,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "wiqaaya_audit",
      timestamps: true,
      updatedAt: false
    }
  );
}

// src/index.ts
function sequelizeAdapter(sequelize) {
  initIdempotencyModel(sequelize);
  initAuditModel(sequelize);
  return {
    transaction: {
      async begin() {
        return sequelize.transaction();
      },
      async commit(tx) {
        await tx.commit();
      },
      async rollback(tx) {
        await tx.rollback();
      }
    },
    idempotency: {
      async find(key) {
        const record = await IdempotencyModel.findByPk(key);
        if (!record) return null;
        return {
          key: record.key,
          requestHash: record.requestHash,
          response: record.response,
          statusCode: record.statusCode,
          createdAt: record.createdAt
        };
      },
      async insert(data) {
        try {
          await IdempotencyModel.create({
            key: data.key,
            requestHash: data.requestHash,
            response: data.response,
            statusCode: data.statusCode
          });
        } catch (error) {
          if (error instanceof UniqueConstraintError) {
            return;
          }
          throw error;
        }
      },
      async delete(key) {
        await IdempotencyModel.destroy({
          where: { key }
        });
      }
    },
    audit: {
      async insert(entry) {
        await AuditModel.create(
          {
            action: entry.action,
            userId: entry.userId?.toString(),
            tenantId: entry.tenantId,
            metadata: entry.metadata
          },
          {
            transaction: entry.transaction
          }
        );
      }
    },
    isUniqueConstraintError(error) {
      return error instanceof UniqueConstraintError;
    }
  };
}
export {
  sequelizeAdapter
};
