export interface IdempotencyRecord {
  id: number;
  route: string;
  idempotencyKey: string;
  requestHash: string;
  responseBody: unknown;
  statusCode: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface IdempotencyInsert {
  route: string;
  idempotencyKey: string;
  requestHash: string;
  responseBody: unknown;
  statusCode: number;
  expiresAt: Date;
}

export interface AuditInsert {
  route: string;
  userId?: string | number;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface WiqaayaAdapter {
  transaction: {
    begin(): Promise<any>;
    commit(tx: any): Promise<void>;
    rollback(tx: any): Promise<void>;
  };

  idempotency: {
    find: (key: string) => Promise<{
      key: string;
      requestHash: string;
      response: unknown;
      statusCode: number;
      createdAt: Date;
    } | null>;

    insert: (data: {
      key: string;
      requestHash: string;
      response: unknown;
      statusCode: number;
    }) => Promise<void>;

    delete?: (key: string) => Promise<void>;
  };

  audit: {
    insert: (entry: {
      action: string;
      userId?: string | number;
      tenantId?: string;
      metadata?: Record<string, unknown>;
      createdAt: Date;
      transaction?: unknown;
    }) => Promise<void>;
  };

  isUniqueConstraintError(error: unknown): boolean;
}
