import { NextResponse } from "next/server";
import { getOpenClawHealth } from "~/server/openclaw/client";
import { getOpenClawEnv } from "~/server/openclaw/env";

export async function GET() {
  const env = getOpenClawEnv();
  const status = await getOpenClawHealth({
    gatewayUrl: env.OPENCLAW_GATEWAY_URL,
    gatewayToken: env.OPENCLAW_GATEWAY_TOKEN,
    agentId: env.OPENCLAW_AGENT_ID,
    timeoutMs: env.OPENCLAW_TIMEOUT_MS,
  });

  return NextResponse.json(status, {
    status: status.ok ? 200 : 503,
  });
}
