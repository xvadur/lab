import { describe, expect, it } from "vitest";
import { getOpenClawEnv } from "../env";

describe("getOpenClawEnv", () => {
  it("throws when OPENCLAW_GATEWAY_TOKEN is missing", () => {
    expect(() =>
      getOpenClawEnv({
        OPENCLAW_GATEWAY_URL: "ws://127.0.0.1:18789",
        OPENCLAW_AGENT_ID: "main",
        OPENCLAW_TIMEOUT_MS: "20000",
      }),
    ).toThrow("OPENCLAW_GATEWAY_TOKEN is required");
  });

  it("applies defaults for url, agent and timeout", () => {
    const env = getOpenClawEnv({
      OPENCLAW_GATEWAY_TOKEN: "token",
    });

    expect(env.OPENCLAW_GATEWAY_URL).toBe("ws://127.0.0.1:18789");
    expect(env.OPENCLAW_AGENT_ID).toBe("main");
    expect(env.OPENCLAW_TIMEOUT_MS).toBe(20000);
  });
});
