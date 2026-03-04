import { z } from "zod";

const OpenClawEnvSchema = z.object({
  OPENCLAW_GATEWAY_URL: z.string().default("ws://127.0.0.1:18789"),
  OPENCLAW_GATEWAY_TOKEN: z
    .string({ required_error: "OPENCLAW_GATEWAY_TOKEN is required" })
    .min(1, "OPENCLAW_GATEWAY_TOKEN is required"),
  OPENCLAW_AGENT_ID: z.string().default("main"),
  OPENCLAW_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
});

export type OpenClawEnv = z.infer<typeof OpenClawEnvSchema>;

export function getOpenClawEnv(input: Partial<Record<keyof OpenClawEnv, string>> = process.env): OpenClawEnv {
  return OpenClawEnvSchema.parse(input);
}
