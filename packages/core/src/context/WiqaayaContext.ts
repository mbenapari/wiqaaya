export interface WiqaayaContext<UserType = any> {
  user?: UserType;
  tenantId?: string;
  transaction?: unknown;

  idempotency?: {
    key: string;
    requestHash: string;
    replayed: boolean;
  };

  audit: {
    log: (data: { action: string; metadata?: Record<string, unknown> }) => void;
  };
}
