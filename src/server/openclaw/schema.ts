import { z } from "zod";

export const OpenClawGatewayResponseSchema = z.object({
  ok: z.boolean().optional(),
  model: z.string().optional(),
  text: z.string().optional(),
  message: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
  output: z.string().optional(),
  response: z.unknown().optional(),
  final: z.unknown().optional(),
  result: z.unknown().optional(),
});

export type OpenClawGatewayResponse = z.infer<typeof OpenClawGatewayResponseSchema>;

export const GenerateRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required"),
  tone: z.enum(["default", "executive", "creative", "concise"]).optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(8000).optional().default(600),
  stream: z.literal(false).optional().default(false),
});
