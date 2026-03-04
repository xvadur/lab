"use client";

type OutputPanelProps = {
  output: string;
  model: string;
  onCopy: () => void;
};

export function OutputPanel({ output, model, onCopy }: OutputPanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/35 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Generated Output</h2>
        <button
          className="rounded-lg border border-cyan-300/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 hover:bg-cyan-500/20"
          onClick={onCopy}
        >
          Copy
        </button>
      </div>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">Model: {model || "n/a"}</p>
      <pre className="mt-4 min-h-72 whitespace-pre-wrap rounded-xl border border-white/15 bg-slate-900/70 p-3 text-sm leading-relaxed text-slate-100">
        {output || "Generated text appears here."}
      </pre>
    </section>
  );
}
