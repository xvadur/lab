import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Tone = "default" | "executive" | "creative" | "concise";
type ToolName = "generate_draft" | "rewrite_text" | "summarize_text" | "tone_score" | "compare_variants";

type ToolResult = {
  ok?: boolean;
  code?: string;
  message?: string;
  traceId?: string;
  latencyMs?: number;
  text?: string;
  rewritten?: string;
  summary?: string;
  score?: number;
  diagnostics?: string[];
  suggestions?: string[];
  winner?: "A" | "B" | "tie";
  rationale?: string;
  improvements?: { forA: string[]; forB: string[] };
};

type RuntimeLog = {
  at: string;
  tool: ToolName;
  status: "ok" | "error";
  traceId: string;
  latencyMs?: number;
  message: string;
};

function getTraceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

declare global {
  interface Window {
    openai?: {
      callTool: (name: string, args: unknown) => Promise<{ structuredContent?: unknown }>;
      sendFollowUpMessage?: (message: string) => Promise<void>;
      toolOutput?: unknown;
    };
  }
}

function extractText(result: ToolResult | null): string {
  if (!result) return "";
  if (result.text) return result.text;
  if (result.rewritten) return result.rewritten;
  if (result.summary) return result.summary;
  if (typeof result.score === "number") {
    return [
      `Tone score: ${result.score}/100`,
      "",
      "Diagnostics:",
      ...(result.diagnostics ?? []).map((line) => `- ${line}`),
      "",
      "Suggestions:",
      ...(result.suggestions ?? []).map((line) => `- ${line}`),
    ].join("\n");
  }
  if (result.winner) {
    return [
      `Winner: ${result.winner}`,
      `Rationale: ${result.rationale ?? ""}`,
      "",
      "Improve A:",
      ...((result.improvements?.forA ?? []).map((x) => `- ${x}`)),
      "",
      "Improve B:",
      ...((result.improvements?.forB ?? []).map((x) => `- ${x}`)),
    ].join("\n");
  }
  return result.message ?? "No output yet.";
}

export function App() {
  const [prompt, setPrompt] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [tone, setTone] = useState<Tone>("default");
  const [temperature, setTemperature] = useState(0.7);
  const [output, setOutput] = useState<ToolResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [stateVersion, setStateVersion] = useState(1);

  const outputText = useMemo(() => extractText(output), [output]);

  const pushLog = (entry: RuntimeLog) => setLogs((prev) => [entry, ...prev].slice(0, 20));

  async function runTool(tool: ToolName, args: unknown) {
    setIsLoading(true);
    const startedAt = Date.now();

    try {
      const response = window.openai
        ? await window.openai.callTool(tool, args)
        : {
            structuredContent: {
              ok: false,
              code: "INTERNAL",
              message: "No ChatGPT bridge available. Run inside ChatGPT Developer Mode.",
              traceId: getTraceId(),
            },
          };

      const result = (response.structuredContent ?? response) as ToolResult;
      setOutput(result);
      setStateVersion((x) => x + 1);

      pushLog({
        at: new Date().toISOString(),
        tool,
        status: result.ok === false ? "error" : "ok",
        traceId: result.traceId ?? getTraceId(),
        latencyMs: result.latencyMs ?? Date.now() - startedAt,
        message: result.ok === false ? `${result.code}: ${result.message}` : "Completed",
      });
    } catch (error) {
      const traceId = getTraceId();
      const fallback: ToolResult = {
        ok: false,
        code: "INTERNAL",
        message: error instanceof Error ? error.message : "Unknown widget error",
        traceId,
      };
      setOutput(fallback);
      pushLog({
        at: new Date().toISOString(),
        tool,
        status: "error",
        traceId,
        latencyMs: Date.now() - startedAt,
        message: fallback.message ?? "Failed",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell" data-state-version={stateVersion}>
      <section className="panel">
        <h2>Input + Actions</h2>

        <label htmlFor="prompt">Prompt / Text</label>
        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

        <div className="row">
          <div>
            <label htmlFor="tone">Tone</label>
            <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              <option value="default">Default</option>
              <option value="executive">Executive</option>
              <option value="creative">Creative</option>
              <option value="concise">Concise</option>
            </select>
          </div>
          <div>
            <label htmlFor="temperature">Temperature</label>
            <input
              id="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label htmlFor="variantA">Variant A</label>
            <textarea id="variantA" value={variantA} onChange={(e) => setVariantA(e.target.value)} />
          </div>
          <div>
            <label htmlFor="variantB">Variant B</label>
            <textarea id="variantB" value={variantB} onChange={(e) => setVariantB(e.target.value)} />
          </div>
        </div>

        <div className="actions">
          <button disabled={isLoading} onClick={() => runTool("generate_draft", { prompt, tone, temperature, maxTokens: 600 })}>Generate</button>
          <button disabled={isLoading} className="secondary" onClick={() => runTool("rewrite_text", { text: prompt, objective: "professionalize", tone })}>Rewrite</button>
          <button disabled={isLoading} className="secondary" onClick={() => runTool("summarize_text", { text: prompt, length: "short" })}>Summarize</button>
          <button disabled={isLoading} className="secondary" onClick={() => runTool("tone_score", { text: prompt, targetTone: tone })}>Tone Score</button>
          <button disabled={isLoading} className="secondary" onClick={() => runTool("compare_variants", { variantA, variantB, goal: "clarity" })}>Compare</button>
        </div>
      </section>

      <section className="panel">
        <h2>Output</h2>
        <span className={`badge ${output?.ok === false ? "error" : "ok"}`}>{output?.ok === false ? "Error" : isLoading ? "Running" : "Ready"}</span>
        <div className="output">{outputText || "Run a tool to see output."}</div>
      </section>

      <section className="panel">
        <h2>Runtime Logs</h2>
        {logs.length === 0 ? <div className="output">No requests yet.</div> : null}
        {logs.map((log) => (
          <div key={`${log.traceId}-${log.at}`} className="log">
            <div><strong>{log.tool}</strong> · {log.status.toUpperCase()}</div>
            <div>traceId: {log.traceId}</div>
            <div>latency: {log.latencyMs ?? 0}ms</div>
            <div>{log.message}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
