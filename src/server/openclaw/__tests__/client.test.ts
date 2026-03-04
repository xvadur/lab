import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OpenClawError } from "../errors";
import { generateWithOpenClaw, parseOpenClawGatewayOutput } from "../client";
import type { OpenClawClientConfig } from "../client";

const config: OpenClawClientConfig = {
  gatewayUrl: "ws://127.0.0.1:18789",
  gatewayToken: "test-token",
  agentId: "main",
  timeoutMs: 5000,
};

describe("parseOpenClawGatewayOutput", () => {
  it("parses successful gateway output", () => {
    const result = parseOpenClawGatewayOutput({
      ok: true,
      model: "openai-codex/gpt-5.3-codex",
      final: { content: "Generated draft text" },
    });

    expect(result.text).toBe("Generated draft text");
    expect(result.model).toBe("openai-codex/gpt-5.3-codex");
  });

  it("rejects malformed payload", () => {
    expect(() => parseOpenClawGatewayOutput({ ok: true, final: { somethingElse: 42 } })).toThrow(z.ZodError);
  });
});

describe("generateWithOpenClaw", () => {
  it("maps timeout errors to TIMEOUT", async () => {
    const runCommand = async () => {
      throw new OpenClawError("TIMEOUT", "timeout");
    };

    await expect(generateWithOpenClaw({ prompt: "hello" }, config, runCommand)).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });

  it("maps auth failures to AUTH_FAILED", async () => {
    const runCommand = async () => {
      throw new OpenClawError("AUTH_FAILED", "auth");
    };

    await expect(generateWithOpenClaw({ prompt: "hello" }, config, runCommand)).rejects.toMatchObject({
      code: "AUTH_FAILED",
    });
  });
});
