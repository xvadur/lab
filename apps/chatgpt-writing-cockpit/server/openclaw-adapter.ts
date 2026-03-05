import { generateWithOpenClaw, type OpenClawClientConfig } from "../../../src/server/openclaw/client";
import { type GenerateRequest } from "../../../src/server/openclaw/types";
import { getCockpitEnv } from "./env";

export function getOpenClawConfigFromEnv(): OpenClawClientConfig {
  const env = getCockpitEnv();
  return {
    gatewayUrl: env.OPENCLAW_GATEWAY_URL,
    gatewayToken: env.OPENCLAW_GATEWAY_TOKEN,
    agentId: env.OPENCLAW_AGENT_ID,
    timeoutMs: env.OPENCLAW_TIMEOUT_MS,
  };
}

export async function runOpenClaw(request: GenerateRequest) {
  return await generateWithOpenClaw(request, getOpenClawConfigFromEnv());
}
