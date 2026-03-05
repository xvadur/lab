import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
} from "../shared/schemas";
import { compareVariants, generateDraft, rewriteText, summarizeText, toneScore } from "./tools";

const __dirname = dirname(fileURLToPath(import.meta.url));
const widgetHtmlPath = resolve(__dirname, "../widget/dist/widget.html");

type ToolPayload = { ok: boolean; traceId: string; code?: string };

function toolResponse(toolName: string, payload: ToolPayload & Record<string, unknown>) {
  const summary = payload.ok
    ? `${toolName} completed (trace ${payload.traceId}).`
    : `${toolName} failed with ${payload.code ?? "INTERNAL"} (trace ${payload.traceId}).`;

  return {
    structuredContent: payload,
    content: [{ type: "text" as const, text: summary }],
    _meta: {
      "openai/outputTemplate": "ui://widget/writing-cockpit.html",
      traceId: payload.traceId,
    },
  };
}

export function createMcpServer(publicBaseUrl?: string): McpServer {
  const widgetDomain = publicBaseUrl ? new URL(publicBaseUrl).origin : undefined;

  const server = new McpServer({
    name: "writing-cockpit",
    version: "0.1.0",
    title: "Writing Cockpit",
    description: "Advanced writing cockpit for generation, rewrite, summarization, tone scoring and variant comparison.",
  });

  server.registerTool(
    "generate_draft",
    {
      title: "Generate draft",
      description: "Use this when you want to generate a fresh draft from a prompt.",
      inputSchema: GenerateDraftInputSchema,
      outputSchema: GenerateDraftOutputSchema.or(ToolErrorSchema),
      annotations: { idempotentHint: true },
      _meta: {
        "openai/outputTemplate": "ui://widget/writing-cockpit.html",
        "openai/toolInvocation/invoking": "Generating draft...",
        "openai/toolInvocation/invoked": "Draft generated",
      },
    },
    async (input) => toolResponse("generate_draft", await generateDraft(input)),
  );

  server.registerTool(
    "rewrite_text",
    {
      title: "Rewrite text",
      description: "Use this when you want to rewrite text toward a specific objective.",
      inputSchema: RewriteInputSchema,
      outputSchema: RewriteOutputSchema.or(ToolErrorSchema),
      annotations: { idempotentHint: true },
      _meta: { "openai/outputTemplate": "ui://widget/writing-cockpit.html" },
    },
    async (input) => toolResponse("rewrite_text", await rewriteText(input)),
  );

  server.registerTool(
    "summarize_text",
    {
      title: "Summarize text",
      description: "Use this when you need a concise summary with explicit length mode.",
      inputSchema: SummarizeInputSchema,
      outputSchema: SummarizeOutputSchema.or(ToolErrorSchema),
      annotations: { idempotentHint: true },
      _meta: { "openai/outputTemplate": "ui://widget/writing-cockpit.html" },
    },
    async (input) => toolResponse("summarize_text", await summarizeText(input)),
  );

  server.registerTool(
    "tone_score",
    {
      title: "Tone score",
      description: "Use this when you need a tone-fit score plus diagnostics and suggestions.",
      inputSchema: ToneScoreInputSchema,
      outputSchema: ToneScoreOutputSchema.or(ToolErrorSchema),
      annotations: { idempotentHint: true },
      _meta: { "openai/outputTemplate": "ui://widget/writing-cockpit.html" },
    },
    async (input) => toolResponse("tone_score", await toneScore(input)),
  );

  server.registerTool(
    "compare_variants",
    {
      title: "Compare variants",
      description: "Use this when you want winner/rationale/improvements between two variants.",
      inputSchema: CompareVariantsInputSchema,
      outputSchema: CompareVariantsOutputSchema.or(ToolErrorSchema),
      annotations: { idempotentHint: true },
      _meta: { "openai/outputTemplate": "ui://widget/writing-cockpit.html" },
    },
    async (input) => toolResponse("compare_variants", await compareVariants(input)),
  );

  server.registerResource(
    "writing-cockpit-widget",
    "ui://widget/writing-cockpit.html",
    {
      title: "Writing Cockpit",
      description: "Three-panel writing cockpit widget for generate/rewrite/summarize/score/compare flows.",
      mimeType: "text/html",
      _meta: {
        "openai/widgetDescription": "Interactive writing cockpit with logs and diagnostics.",
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": {
          connect_domains: [],
          resource_domains: widgetDomain ? [widgetDomain] : [],
        },
        "ui.prefersBorder": true,
        "ui.description": "Interactive writing cockpit with logs and diagnostics.",
        "ui.csp": {
          connectDomains: [],
          resourceDomains: widgetDomain ? [widgetDomain] : [],
        },
        ...(widgetDomain ? { "ui.domain": widgetDomain } : {}),
      },
    },
    async () => ({
      contents: [
        {
          uri: "ui://widget/writing-cockpit.html",
          mimeType: "text/html",
          text: readFileSync(widgetHtmlPath, "utf8"),
          _meta: {
            "openai/widgetDescription": "Interactive writing cockpit with logs and diagnostics.",
            "openai/widgetPrefersBorder": true,
            ...(widgetDomain ? { "ui.domain": widgetDomain } : {}),
          },
        },
      ],
    }),
  );

  return server;
}
