"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  sequelizeAdapter: () => sequelizeAdapter
});
module.exports = __toCommonJS(index_exports);
var import_sequelize3 = require("sequelize");

// src/models/Idempotency.ts
var import_sequelize = require("sequelize");
var IdempotencyModel = class extends import_sequelize.Model {
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
        type: import_sequelize.DataTypes.STRING(255),
        primaryKey: true
      },
      requestHash: {
        type: import_sequelize.DataTypes.STRING(64),
        allowNull: false
      },
      response: {
        type: import_sequelize.DataTypes.JSON,
        allowNull: false
      },
      statusCode: {
        type: import_sequelize.DataTypes.INTEGER,
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
var import_sequelize2 = require("sequelize");
var AuditModel = class extends import_sequelize2.Model {
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
        type: import_sequelize2.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      action: {
        type: import_sequelize2.DataTypes.STRING(255),
        allowNull: false
      },
      userId: {
        type: import_sequelize2.DataTypes.STRING,
        allowNull: true
      },
      tenantId: {
        type: import_sequelize2.DataTypes.STRING,
        allowNull: true
      },
      metadata: {
        type: import_sequelize2.DataTypes.JSON,
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
          if (error instanceof import_sequelize3.UniqueConstraintError) {
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
      return error instanceof import_sequelize3.UniqueConstraintError;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sequelizeAdapter
});
