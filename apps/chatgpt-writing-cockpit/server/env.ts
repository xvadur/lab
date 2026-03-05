import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const CockpitEnvSchema = z.object({
  OPENCLAW_GATEWAY_URL: z.string().default("ws://127.0.0.1:18789"),
  OPENCLAW_GATEWAY_TOKEN: z.string().min(1, "OPENCLAW_GATEWAY_TOKEN is required"),
  OPENCLAW_AGENT_ID: z.string().default("main"),
  OPENCLAW_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  MCP_PORT: z.coerce.number().int().positive().default(9090),
  PUBLIC_BASE_URL: z.string().url().optional(),
});

export type CockpitEnv = z.infer<typeof CockpitEnvSchema>;

function parseDotEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function loadLocalEnvFile(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};

  try {
    return parseDotEnv(readFileSync(envPath, "utf8"));
  } catch {
    return {};
  }
}

export function getCockpitEnv(input: Record<string, string | undefined> = process.env): CockpitEnv {
  const fileEnv = loadLocalEnvFile();
  return CockpitEnvSchema.parse({
    ...fileEnv,
    ...input,
  });
}
