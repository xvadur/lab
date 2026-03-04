export type OpenClawErrorCode =
  | "BAD_REQUEST"
  | "GATEWAY_UNREACHABLE"
  | "TIMEOUT"
  | "AUTH_FAILED"
  | "INTERNAL";

export class OpenClawError extends Error {
  code: OpenClawErrorCode;
  traceId?: string;
  cause?: unknown;

  constructor(code: OpenClawErrorCode, message: string, options?: { cause?: unknown; traceId?: string }) {
    super(message);
    this.name = "OpenClawError";
    this.code = code;
    this.cause = options?.cause;
    this.traceId = options?.traceId;
  }
}
