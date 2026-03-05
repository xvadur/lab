import { z } from "zod";

export const ToneSchema = z.enum(["default", "executive", "creative", "concise"]);

export const ToolErrorSchema = z.object({
  ok: z.literal(false),
  code: z.enum(["BAD_REQUEST", "GATEWAY_UNREACHABLE", "TIMEOUT", "AUTH_FAILED", "INTERNAL"]),
  message: z.string(),
  traceId: z.string(),
});

export const GenerateDraftInputSchema = z.object({
  prompt: z.string().trim().min(1),
  tone: ToneSchema.default("default"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(8000).default(600),
});

export const GenerateDraftOutputSchema = z.object({
  ok: z.literal(true),
  text: z.string(),
  model: z.string(),
  latencyMs: z.number().int().nonnegative(),
  traceId: z.string(),
});

export const RewriteObjectiveSchema = z.enum(["clarify", "shorten", "expand", "professionalize", "casualize"]);

export const RewriteInputSchema = z.object({
  text: z.string().trim().min(1),
  objective: RewriteObjectiveSchema,
  tone: ToneSchema.optional(),
});

export const RewriteOutputSchema = z.object({
  ok: z.literal(true),
  rewritten: z.string(),
  traceId: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export const SummaryLengthSchema = z.enum(["bullet-brief", "short", "medium"]);

export const SummarizeInputSchema = z.object({
  text: z.string().trim().min(1),
  length: SummaryLengthSchema,
});

export const SummarizeOutputSchema = z.object({
  ok: z.literal(true),
  summary: z.string(),
  traceId: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export const ToneScoreInputSchema = z.object({
  text: z.string().trim().min(1),
  targetTone: ToneSchema,
});

export const ToneScoreOutputSchema = z.object({
  ok: z.literal(true),
  score: z.number().min(0).max(100),
  diagnostics: z.array(z.string()).min(1),
  suggestions: z.array(z.string()).min(1),
  traceId: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export const CompareGoalSchema = z.enum(["clarity", "persuasion", "brevity", "brand-fit"]);

export const CompareVariantsInputSchema = z.object({
  variantA: z.string().trim().min(1),
  variantB: z.string().trim().min(1),
  goal: CompareGoalSchema,
});

export const CompareVariantsOutputSchema = z.object({
  ok: z.literal(true),
  winner: z.enum(["A", "B", "tie"]),
  rationale: z.string(),
  improvements: z.object({
    forA: z.array(z.string()),
    forB: z.array(z.string()),
  }),
  traceId: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export type ToolError = z.infer<typeof ToolErrorSchema>;
export type GenerateDraftInput = z.infer<typeof GenerateDraftInputSchema>;
export type GenerateDraftOutput = z.infer<typeof GenerateDraftOutputSchema>;
export type RewriteInput = z.infer<typeof RewriteInputSchema>;
export type RewriteOutput = z.infer<typeof RewriteOutputSchema>;
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;
export type ToneScoreInput = z.infer<typeof ToneScoreInputSchema>;
export type ToneScoreOutput = z.infer<typeof ToneScoreOutputSchema>;
export type CompareVariantsInput = z.infer<typeof CompareVariantsInputSchema>;
export type CompareVariantsOutput = z.infer<typeof CompareVariantsOutputSchema>;
