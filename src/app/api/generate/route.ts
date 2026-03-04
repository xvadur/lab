import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateWithOpenClaw } from "@/server/openclaw/client";
import { OpenClawError } from "@/server/openclaw/errors";
import { getOpenClawEnv } from "@/server/openclaw/env";
import { GenerateRequestSchema } from "@/server/openclaw/schema";

type ApiErrorCode = "BAD_REQUEST" | "GATEWAY_UNREACHABLE" | "TIMEOUT" | "AUTH_FAILED" | "INTERNAL";

function mapCodeToStatus(code: ApiErrorCode): number {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "AUTH_FAILED":
      return 401;
    case "TIMEOUT":
      return 504;
    case "GATEWAY_UNREACHABLE":
      return 502;
    default:
      return 500;
  }
}

export async function POST(request: Request) {
  const traceId = randomUUID();
  const start = Date.now();

  try {
    const json = (await request.json()) as unknown;
    const payload = GenerateRequestSchema.parse(json);
    const env = getOpenClawEnv();

    const result = await generateWithOpenClaw(payload, {
      gatewayUrl: env.OPENCLAW_GATEWAY_URL,
      gatewayToken: env.OPENCLAW_GATEWAY_TOKEN,
      agentId: env.OPENCLAW_AGENT_ID,
      timeoutMs: env.OPENCLAW_TIMEOUT_MS,
    });

    return NextResponse.json({
      ok: true,
      text: result.text,
      model: result.model,
      latencyMs: Date.now() - start,
      traceId,
    });
  } catch (err) {
    let code: ApiErrorCode = "INTERNAL";
    let message = "Unexpected server error";

    if (err instanceof ZodError) {
      code = "BAD_REQUEST";
      message = err.issues[0]?.message ?? "Invalid request payload";
    } else if (err instanceof OpenClawError) {
      code = err.code;
      message = err.message;
    }

    return NextResponse.json(
      {
        ok: false,
        code,
        message,
        traceId,
      },
      { status: mapCodeToStatus(code) },
    );
  }
}
