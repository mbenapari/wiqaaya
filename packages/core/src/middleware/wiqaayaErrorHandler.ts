import type { Request, Response, NextFunction } from "express"
import { normalizeError } from "../errors/normalizeError"

export function wiqaayaErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const normalized = normalizeError(err)

  const isProduction =
    process.env.NODE_ENV === "production"

  const responseBody: any = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message
    }
  }

  if (!isProduction && normalized.details) {
    responseBody.error.details =
      normalized.details
  }

  res.status(normalized.statusCode).json(responseBody)
}