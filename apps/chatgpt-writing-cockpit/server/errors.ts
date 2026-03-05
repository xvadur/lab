import { randomUUID } from "node:crypto";
import type { ToolError } from "../shared/schemas";

type KnownCode = ToolError["code"];

const MSG_BY_CODE: Record<KnownCode, string> = {
  BAD_REQUEST: "Invalid tool input",
  GATEWAY_UNREACHABLE: "OpenClaw gateway is unreachable",
  TIMEOUT: "OpenClaw request timed out",
  AUTH_FAILED: "OpenClaw authentication failed",
  INTERNAL: "Unexpected internal error",
};

export function toToolError(error: unknown, traceId = randomUUID()): ToolError {
  if (error && typeof error === "object") {
    const e = error as { code?: string; message?: string; traceId?: string };
    if (e.code && e.code in MSG_BY_CODE) {
      return {
        ok: false,
        code: e.code as KnownCode,
        message: MSG_BY_CODE[e.code as KnownCode],
        traceId: e.traceId ?? traceId,
      };
    }
  }

  return {
    ok: false,
    code: "INTERNAL",
    message: "Unexpected internal error",
    traceId,
  };
}
