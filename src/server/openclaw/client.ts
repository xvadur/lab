import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { OpenClawError } from "./errors";
import { OpenClawGatewayResponseSchema } from "./schema";
import type { GatewayHealth, GenerateRequest, GenerateResult } from "./types";

type OpenClawClientConfig = {
  gatewayUrl: string;
  gatewayToken: string;
  agentId: string;
  timeoutMs: number;
};

type CommandRunner = (
  method: string,
  params: Record<string, unknown>,
  config: OpenClawClientConfig,
) => Promise<unknown>;

const REDACTED = "[REDACTED]";

function redactSecrets(input: string, secrets: string[]): string {
  return secrets.reduce((acc, secret) => {
    if (!secret) return acc;
    return acc.split(secret).join(REDACTED);
  }, input);
}

function extractText(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const out = extractText(item);
      if (out) return out;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "content", "message", "output", "response", "final", "result"]) {
      const out = extractText(record[key]);
      if (out) return out;
    }
  }
  return null;
}

export function parseOpenClawGatewayOutput(payload: unknown): GenerateResult {
  const parsed = OpenClawGatewayResponseSchema.parse(payload);
  const text = extractText(parsed.text ?? parsed.final ?? parsed.response ?? parsed.result ?? parsed.content ?? parsed.message);
  if (!text) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "Missing generated text in gateway response",
        path: ["text"],
      },
    ]);
  }

  return {
    text,
    model: parsed.model ?? "openclaw/unknown",
  };
}

export async function defaultCommandRunner(
  method: string,
  params: Record<string, unknown>,
  config: OpenClawClientConfig,
): Promise<unknown> {
  const traceId = randomUUID();
  const args = [
    "gateway",
    "call",
    method,
    "--json",
    "--expect-final",
    "--url",
    config.gatewayUrl,
    "--token",
    config.gatewayToken,
    "--timeout",
    String(config.timeoutMs),
    "--params",
    JSON.stringify(params),
  ];

  const child = spawn("openclaw", args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const timeoutId = setTimeout(() => {
    child.kill("SIGTERM");
  }, config.timeoutMs);

  return await new Promise((resolve, reject) => {
    child.once("error", (err) => {
      clearTimeout(timeoutId);
      reject(new OpenClawError("GATEWAY_UNREACHABLE", "Failed to execute openclaw CLI", { cause: err, traceId }));
    });

    child.once("close", (code, signal) => {
      clearTimeout(timeoutId);
      if (signal === "SIGTERM") {
        reject(new OpenClawError("TIMEOUT", "OpenClaw command timed out", { traceId }));
        return;
      }

      if (code !== 0) {
        const safeErr = redactSecrets(stderr || "OpenClaw command failed", [config.gatewayToken]);
        if (/auth|token|unauthorized|forbidden/i.test(safeErr)) {
          reject(new OpenClawError("AUTH_FAILED", "OpenClaw authentication failed", { traceId }));
          return;
        }
        reject(new OpenClawError("GATEWAY_UNREACHABLE", safeErr, { traceId }));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new OpenClawError("INTERNAL", "Invalid JSON from OpenClaw command", { cause: err, traceId }));
      }
    });
  });
}

export async function generateWithOpenClaw(
  req: GenerateRequest,
  config: OpenClawClientConfig,
  runCommand: CommandRunner = defaultCommandRunner,
): Promise<GenerateResult> {
  const payload = await runCommand(
    "message.send",
    {
      agent: config.agentId,
      message: req.prompt,
      local: true,
      meta: {
        tone: req.tone ?? "default",
        temperature: req.temperature ?? 0.7,
        maxTokens: req.maxTokens ?? 600,
      },
    },
    config,
  );

  try {
    return parseOpenClawGatewayOutput(payload);
  } catch (err) {
    if (err instanceof OpenClawError) throw err;
    if (err instanceof z.ZodError) {
      throw new OpenClawError("INTERNAL", "Unexpected response shape from OpenClaw");
    }
    throw err;
  }
}

export async function getOpenClawHealth(
  config: OpenClawClientConfig,
  runCommand: CommandRunner = defaultCommandRunner,
): Promise<GatewayHealth> {
  try {
    const payload = await runCommand("health", {}, config);
    const ok = z.object({ ok: z.boolean() }).safeParse(payload);
    return {
      ok: ok.success ? ok.data.ok : false,
      gateway: ok.success && ok.data.ok ? "up" : "down",
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      ok: false,
      gateway: "down",
      checkedAt: new Date().toISOString(),
    };
  }
}

export type { OpenClawClientConfig };
