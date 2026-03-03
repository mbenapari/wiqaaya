import { WiqaayaError } from "./WiqaayaError"

export function normalizeError(error: unknown) {
  if (error instanceof WiqaayaError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details
    }
  }

  // Unknown error — internal failure
  return {
    statusCode: 500,
    code: "WIQ_500_INTERNAL_ERROR",
    message: "Internal server error"
  }
}