import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  CompareVariantsInputSchema,
  CompareVariantsOutputSchema,
  GenerateDraftInputSchema,
  GenerateDraftOutputSchema,
  RewriteInputSchema,
  RewriteOutputSchema,
  SummarizeInputSchema,
  SummarizeOutputSchema,
  ToneScoreInputSchema,
  ToneScoreOutputSchema,
  ToolErrorSchema,
  type CompareVariantsInput,
  type GenerateDraftInput,
  type RewriteInput,
  type SummarizeInput,
  type ToneScoreInput,
} from "../shared/schemas";
import { toToolError } from "./errors";
import { runOpenClaw } from "./openclaw-adapter";

type ToolResult<T> = T | z.infer<typeof ToolErrorSchema>;

function traceStart() {
  return { startedAt: Date.now(), traceId: randomUUID() };
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function generateInstructionPrompt(input: GenerateDraftInput): string {
  return [
    `You are a writing copilot. Produce high-quality text in ${input.tone} tone.`,
    "Return only the final text body without markdown fences.",
    "User prompt:",
    input.prompt,
  ].join("\n\n");
}

function rewriteInstructionPrompt(input: RewriteInput): string {
  const toneClause = input.tone ? ` Preserve target tone as ${input.tone}.` : "";
  return [
    `Rewrite the text to objective: ${input.objective}.${toneClause}`,
    "Return rewritten text only.",
    "Text:",
    input.text,
  ].join("\n\n");
}

function summarizeInstructionPrompt(input: SummarizeInput): string {
  const map = {
    "bullet-brief": "3-5 bullets, each max 12 words",
    short: "single compact paragraph under 80 words",
    medium: "two short paragraphs under 170 words total",
  } as const;

  return [
    `Summarize the text with this format: ${map[input.length]}.`,
    "Return summary only.",
    "Text:",
    input.text,
  ].join("\n\n");
}

function toneScoreInstructionPrompt(input: ToneScoreInput): string {
  return [
    "Evaluate tone fitness and return strict JSON with keys:",
    '{"score": number 0-100, "diagnostics": string[], "suggestions": string[]}',
    `Target tone: ${input.targetTone}`,
    "Text:",
    input.text,
  ].join("\n\n");
}

function compareInstructionPrompt(input: CompareVariantsInput): string {
  return [
    "Compare variant A and B and return strict JSON:",
    '{"winner":"A"|"B"|"tie","rationale":string,"improvements":{"forA":string[],"forB":string[]}}',
    `Optimization goal: ${input.goal}`,
    "Variant A:",
    input.variantA,
    "Variant B:",
    input.variantB,
  ].join("\n\n");
}

function parseJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("No valid JSON object found");
  }
}

export async function generateDraft(inputRaw: unknown): Promise<ToolResult<z.infer<typeof GenerateDraftOutputSchema>>> {
  const trace = traceStart();

  try {
    const input = GenerateDraftInputSchema.parse(inputRaw);
    const result = await runOpenClaw({
      prompt: generateInstructionPrompt(input),
      tone: input.tone,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      stream: false,
    });

    return GenerateDraftOutputSchema.parse({
      ok: true,
      text: result.text,
      model: result.model,
      latencyMs: elapsedMs(trace.startedAt),
      traceId: trace.traceId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid tool input",
        traceId: trace.traceId,
      };
    }
    return toToolError(error, trace.traceId);
  }
}

export async function rewriteText(inputRaw: unknown): Promise<ToolResult<z.infer<typeof RewriteOutputSchema>>> {
  const trace = traceStart();

  try {
    const input = RewriteInputSchema.parse(inputRaw);
    const result = await runOpenClaw({
      prompt: rewriteInstructionPrompt(input),
      tone: input.tone ?? "default",
      temperature: 0.6,
      maxTokens: 900,
      stream: false,
    });

    return RewriteOutputSchema.parse({
      ok: true,
      rewritten: result.text,
      traceId: trace.traceId,
      latencyMs: elapsedMs(trace.startedAt),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid tool input",
        traceId: trace.traceId,
      };
    }
    return toToolError(error, trace.traceId);
  }
}

export async function summarizeText(inputRaw: unknown): Promise<ToolResult<z.infer<typeof SummarizeOutputSchema>>> {
  const trace = traceStart();

  try {
    const input = SummarizeInputSchema.parse(inputRaw);
    const result = await runOpenClaw({
      prompt: summarizeInstructionPrompt(input),
      tone: "concise",
      temperature: 0.4,
      maxTokens: 600,
      stream: false,
    });

    return SummarizeOutputSchema.parse({
      ok: true,
      summary: result.text,
      traceId: trace.traceId,
      latencyMs: elapsedMs(trace.startedAt),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid tool input",
        traceId: trace.traceId,
      };
    }
    return toToolError(error, trace.traceId);
  }
}

export async function toneScore(inputRaw: unknown): Promise<ToolResult<z.infer<typeof ToneScoreOutputSchema>>> {
  const trace = traceStart();

  try {
    const input = ToneScoreInputSchema.parse(inputRaw);
    const result = await runOpenClaw({
      prompt: toneScoreInstructionPrompt(input),
      tone: "executive",
      temperature: 0.2,
      maxTokens: 500,
      stream: false,
    });

    const parsed = parseJsonFromText(result.text);
    const data = z
      .object({
        score: z.number().min(0).max(100),
        diagnostics: z.array(z.string()).min(1),
        suggestions: z.array(z.string()).min(1),
      })
      .parse(parsed);

    return ToneScoreOutputSchema.parse({
      ok: true,
      ...data,
      traceId: trace.traceId,
      latencyMs: elapsedMs(trace.startedAt),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid tool input",
        traceId: trace.traceId,
      };
    }
    return toToolError(error, trace.traceId);
  }
}

export async function compareVariants(inputRaw: unknown): Promise<ToolResult<z.infer<typeof CompareVariantsOutputSchema>>> {
  const trace = traceStart();

  try {
    const input = CompareVariantsInputSchema.parse(inputRaw);
    const result = await runOpenClaw({
      prompt: compareInstructionPrompt(input),
      tone: "default",
      temperature: 0.3,
      maxTokens: 650,
      stream: false,
    });

    const parsed = parseJsonFromText(result.text);
    const data = z
      .object({
        winner: z.enum(["A", "B", "tie"]),
        rationale: z.string(),
        improvements: z.object({ forA: z.array(z.string()), forB: z.array(z.string()) }),
      })
      .parse(parsed);

    return CompareVariantsOutputSchema.parse({
      ok: true,
      ...data,
      traceId: trace.traceId,
      latencyMs: elapsedMs(trace.startedAt),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "BAD_REQUEST",
        message: "Invalid tool input",
        traceId: trace.traceId,
      };
    }
    return toToolError(error, trace.traceId);
  }
}
