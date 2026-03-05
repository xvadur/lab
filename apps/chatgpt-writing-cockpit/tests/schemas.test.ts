import { describe, expect, it } from "vitest";
import {
  CompareVariantsInputSchema,
  GenerateDraftInputSchema,
  RewriteInputSchema,
  SummarizeInputSchema,
  ToneScoreInputSchema,
} from "../shared/schemas";

describe("tool schemas", () => {
  it("validates generate draft inputs", () => {
    const result = GenerateDraftInputSchema.parse({ prompt: "hello" });
    expect(result.tone).toBe("default");
    expect(result.temperature).toBe(0.7);
  });

  it("validates rewrite objective enum", () => {
    expect(() => RewriteInputSchema.parse({ text: "abc", objective: "clarify" })).not.toThrow();
    expect(() => RewriteInputSchema.parse({ text: "abc", objective: "nope" })).toThrow();
  });

  it("validates summarize length enum", () => {
    expect(() => SummarizeInputSchema.parse({ text: "x", length: "short" })).not.toThrow();
    expect(() => SummarizeInputSchema.parse({ text: "x", length: "huge" })).toThrow();
  });

  it("validates tone score", () => {
    expect(() => ToneScoreInputSchema.parse({ text: "x", targetTone: "concise" })).not.toThrow();
  });

  it("validates compare variants", () => {
    expect(() => CompareVariantsInputSchema.parse({ variantA: "a", variantB: "b", goal: "brevity" })).not.toThrow();
  });
});
