import {
  DataTypes,
  Model,
  Sequelize,
  Optional
} from "sequelize"

interface IdempotencyAttributes {
  key: string
  requestHash: string
  response: object
  statusCode: number
  createdAt?: Date
  updatedAt?: Date
}

type CreationAttributes = Optional<
  IdempotencyAttributes,
  "createdAt" | "updatedAt"
>

export class IdempotencyModel
  extends Model<
    IdempotencyAttributes,
    CreationAttributes
  >
  implements IdempotencyAttributes
{
  public key!: string
  public requestHash!: string
  public response!: object
  public statusCode!: number

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export function initIdempotencyModel(
  sequelize: Sequelize
) {
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
  )
}