import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenClawError } from "~/server/openclaw/errors";

const generateWithOpenClawMock = vi.fn();
const getOpenClawHealthMock = vi.fn();
const getOpenClawEnvMock = vi.fn(() => ({
  OPENCLAW_GATEWAY_URL: "ws://127.0.0.1:18789",
  OPENCLAW_GATEWAY_TOKEN: "token",
  OPENCLAW_AGENT_ID: "main",
  OPENCLAW_TIMEOUT_MS: 20000,
}));

vi.mock("~/server/openclaw/client", () => ({
  generateWithOpenClaw: generateWithOpenClawMock,
  getOpenClawHealth: getOpenClawHealthMock,
}));

vi.mock("~/server/openclaw/env", () => ({
  getOpenClawEnv: getOpenClawEnvMock,
}));

describe("/api/generate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on empty prompt", async () => {
    const { POST } = await import("../generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "" }),
      }),
    );

    const body = (await response.json()) as { ok: boolean; code: string };
    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
  });

  it("returns normalized success shape", async () => {
    generateWithOpenClawMock.mockResolvedValue({
      text: "Generated text",
      model: "openai-codex/gpt-5.3-codex",
    });

    const { POST } = await import("../generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "Write hello" }),
      }),
    );

    const body = (await response.json()) as { ok: boolean; text: string; latencyMs: number; traceId: string };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.text).toBe("Generated text");
    expect(body.latencyMs).toBeTypeOf("number");
    expect(body.traceId).toBeTruthy();
  });

  it("maps timeout to 504 with TIMEOUT code", async () => {
    generateWithOpenClawMock.mockRejectedValue(new OpenClawError("TIMEOUT", "timeout"));
    const { POST } = await import("../generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "hello" }),
      }),
    );

    const body = (await response.json()) as { code: string };
    expect(response.status).toBe(504);
    expect(body.code).toBe("TIMEOUT");
  });
});

describe("/api/health route", () => {
  it("returns gateway status", async () => {
    getOpenClawHealthMock.mockResolvedValue({
      ok: true,
      gateway: "up",
      checkedAt: "2026-03-05T00:00:00.000Z",
    });

    const { GET } = await import("../health/route");
    const response = await GET();
    const body = (await response.json()) as { ok: boolean; gateway: string };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.gateway).toBe("up");
  });
});
