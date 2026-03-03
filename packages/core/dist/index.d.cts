import { Request, Response, NextFunction } from 'express';

interface IdempotencyRecord {
    id: number;
    route: string;
    idempotencyKey: string;
    requestHash: string;
    responseBody: unknown;
    statusCode: number;
    createdAt: Date;
    expiresAt: Date;
}
interface IdempotencyInsert {
    route: string;
    idempotencyKey: string;
    requestHash: string;
    responseBody: unknown;
    statusCode: number;
    expiresAt: Date;
}
interface AuditInsert {
    route: string;
    userId?: string | number;
    tenantId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
interface WiqaayaAdapter {
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

interface WiqaayaConfig {
    adapter: WiqaayaAdapter;
    strictMode?: boolean;
    financialMode?: boolean;
    multiTenant?: boolean;
    idempotency?: {
        enabled: boolean;
        ttl: number;
        headerName?: string;
    };
    userProperty?: string;
}

interface InternalConfig extends Required<WiqaayaConfig> {
    idempotency: {
        enabled: boolean;
        ttl: number;
        headerName: string;
    };
    userProperty: string;
}

declare function wiqaaya(userConfig: WiqaayaConfig): void;
declare function getInternalConfig(): InternalConfig;

interface RouteConfig {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    requireAuth: boolean;
    roles?: string[];
    transactional: boolean;
    idempotent: boolean;
    audit?: boolean;
}

interface WiqaayaContext<UserType = any> {
    user?: UserType;
    tenantId?: string;
    transaction?: unknown;
    idempotency?: {
        key: string;
        requestHash: string;
        replayed: boolean;
    };
    audit: {
        log: (data: {
            action: string;
            metadata?: Record<string, unknown>;
        }) => void;
    };
}

declare function secureRoute<TResponse = any, TUser = any>(routeConfig: RouteConfig, handler: (req: Request, ctx: WiqaayaContext<TUser>) => Promise<TResponse>): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;

declare class WiqaayaError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>);
}

declare function wiqaayaErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;

export { type AuditInsert, type IdempotencyInsert, type IdempotencyRecord, type RouteConfig, type WiqaayaAdapter, type WiqaayaConfig, type WiqaayaContext, WiqaayaError, getInternalConfig, secureRoute, wiqaaya, wiqaayaErrorHandler };
