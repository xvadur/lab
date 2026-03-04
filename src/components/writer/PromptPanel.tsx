"use client";

import type { WriterTone } from "~/server/openclaw/types";

type PromptPanelProps = {
  prompt: string;
  tone: WriterTone;
  temperature: number;
  isLoading: boolean;
  onPromptChange: (value: string) => void;
  onToneChange: (value: WriterTone) => void;
  onTemperatureChange: (value: number) => void;
  onSubmit: () => void;
};

export function PromptPanel({
  prompt,
  tone,
  temperature,
  isLoading,
  onPromptChange,
  onToneChange,
  onTemperatureChange,
  onSubmit,
}: PromptPanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/35 p-5 shadow-xl backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Prompt Console</h2>
      <p className="mt-1 text-sm text-slate-300">Write your request and shape generation behavior.</p>

      <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-slate-300">Prompt</label>
      <textarea
        className="mt-2 h-48 w-full resize-none rounded-xl border border-white/15 bg-slate-900/70 p-3 text-sm text-white outline-none ring-0 focus:border-cyan-400"
        placeholder="Write a launch announcement for our AI showcase..."
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-300">
          Tone
          <select
            className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/70 p-2 text-sm text-white"
            value={tone}
            onChange={(event) => onToneChange(event.target.value as WriterTone)}
          >
            <option value="default">Default</option>
            <option value="executive">Executive</option>
            <option value="creative">Creative</option>
            <option value="concise">Concise</option>
          </select>
        </label>

        <label className="text-xs uppercase tracking-[0.2em] text-slate-300">
          Temperature ({temperature.toFixed(1)})
          <input
            className="mt-3 w-full accent-cyan-400"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(event) => onTemperatureChange(Number(event.target.value))}
          />
        </label>
      </div>

      <button
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
    </section>
  );
}
