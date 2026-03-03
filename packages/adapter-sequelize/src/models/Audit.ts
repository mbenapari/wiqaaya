import {
  DataTypes,
  Model,
  Sequelize
} from "sequelize"

export class AuditModel extends Model {
  public id!: number
  public action!: string
  public userId?: string
  public tenantId?: string
  public metadata?: object
  public createdAt!: Date
}

export function initAuditModel(sequelize: Sequelize) {
  AuditModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      tenantId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "wiqaaya_audit",
      timestamps: true,
      updatedAt: false
    }
  )
}