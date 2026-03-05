import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/openclaw-adapter", () => {
  return {
    runOpenClaw: vi.fn(),
  };
});

import { runOpenClaw } from "../server/openclaw-adapter";
import { compareVariants, generateDraft, rewriteText, summarizeText, toneScore } from "../server/tools";

const mockRunOpenClaw = vi.mocked(runOpenClaw);

describe("tool handlers", () => {
  beforeEach(() => {
    mockRunOpenClaw.mockReset();
  });

  it("returns bad request for invalid input", async () => {
    const result = await generateDraft({ prompt: "" });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe("BAD_REQUEST");
    }
  });

  it("maps gateway timeout errors", async () => {
    mockRunOpenClaw.mockRejectedValueOnce({ code: "TIMEOUT" });
    const result = await summarizeText({ text: "abc", length: "short" });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe("TIMEOUT");
    }
  });

  it("returns generate draft payload", async () => {
    mockRunOpenClaw.mockResolvedValueOnce({ text: "draft out", model: "m1" });
    const result = await generateDraft({ prompt: "hello", tone: "default", temperature: 0.5, maxTokens: 120 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toContain("draft out");
      expect(result.model).toBe("m1");
    }
  });

  it("returns rewrite text payload", async () => {
    mockRunOpenClaw.mockResolvedValueOnce({ text: "rewritten", model: "m2" });
    const result = await rewriteText({ text: "orig", objective: "clarify" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rewritten).toContain("rewritten");
  });

  it("returns tone score payload", async () => {
    mockRunOpenClaw.mockResolvedValueOnce({
      text: '{"score":82,"diagnostics":["Needs tighter verbs"],"suggestions":["Use active voice"]}',
      model: "m3",
    });
    const result = await toneScore({ text: "hello", targetTone: "executive" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.score).toBe(82);
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  });

  it("returns compare variants payload", async () => {
    mockRunOpenClaw.mockResolvedValueOnce({
      text: '{"winner":"A","rationale":"clearer","improvements":{"forA":["add CTA"],"forB":["shorten intro"]}}',
      model: "m4",
    });
    const result = await compareVariants({ variantA: "a", variantB: "b", goal: "clarity" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.winner).toBe("A");
      expect(result.improvements.forB[0]).toContain("shorten");
    }
  });
});
