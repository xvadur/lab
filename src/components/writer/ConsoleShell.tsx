"use client";

import { useState } from "react";
import { z } from "zod";
import type { WriterTone } from "~/server/openclaw/types";
import { OutputPanel } from "./OutputPanel";
import { PromptPanel } from "./PromptPanel";
import { RuntimePanel, type RuntimeLog } from "./RuntimePanel";

const GenerateSuccessSchema = z.object({
  ok: z.literal(true),
  text: z.string(),
  model: z.string(),
  latencyMs: z.number(),
  traceId: z.string(),
});

const GenerateFailureSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
  message: z.string(),
  traceId: z.string(),
});

export function ConsoleShell() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<WriterTone>("default");
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<RuntimeLog[]>([]);

  async function onSubmit() {
    if (!prompt.trim()) {
      setError("Prompt is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tone,
          temperature,
          stream: false,
        }),
      });
      const json = (await response.json()) as unknown;
      const failureParsed = GenerateFailureSchema.safeParse(json);
      const successParsed = GenerateSuccessSchema.safeParse(json);

      if (!response.ok || failureParsed.success) {
        const failure = failureParsed.success
          ? failureParsed.data
          : {
              code: "INTERNAL",
              message: "Unexpected server error",
              traceId: crypto.randomUUID(),
              ok: false as const,
            };
        const message =
          failure.code === "GATEWAY_UNREACHABLE"
            ? "OpenClaw gateway is unreachable. Start it and retry."
            : failure.message;
        setError(message);
        setLogs((prev) => [
          {
            traceId: failure.traceId ?? crypto.randomUUID(),
            status: "error",
            message,
          },
          ...prev,
        ]);
        return;
      }

      if (!successParsed.success) {
        throw new Error("Unexpected success payload");
      }

      const success = successParsed.data;
      setOutput(success.text);
      setModel(success.model);
      setLogs((prev) => [
        {
          traceId: success.traceId,
          status: "success",
          latencyMs: success.latencyMs,
          message: "Generation completed.",
        },
        ...prev,
      ]);
    } catch {
      const message = "OpenClaw gateway is unreachable. Start it and retry.";
      setError(message);
      setLogs((prev) => [
        {
          traceId: crypto.randomUUID(),
          status: "error",
          message,
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onCopy() {
    if (!output) return;
    void navigator.clipboard?.writeText(output);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">OpenClaw Local Runtime</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">AI Writing Console Showcase</h1>
      </header>

      {error ? (
        <div className="mb-4 rounded-xl border border-amber-300/40 bg-amber-400/15 p-3 text-sm text-amber-100">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PromptPanel
          prompt={prompt}
          tone={tone}
          temperature={temperature}
          isLoading={isLoading}
          onPromptChange={setPrompt}
          onToneChange={setTone}
          onTemperatureChange={setTemperature}
          onSubmit={onSubmit}
        />
        <OutputPanel output={output} model={model} onCopy={onCopy} />
        <RuntimePanel logs={logs} />
      </div>
    </div>
  );
}
