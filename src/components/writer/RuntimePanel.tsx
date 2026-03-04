"use client";

export type RuntimeLog = {
  traceId: string;
  status: "success" | "error";
  latencyMs?: number;
  message: string;
};

type RuntimePanelProps = {
  logs: RuntimeLog[];
};

export function RuntimePanel({ logs }: RuntimePanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/35 p-5 shadow-xl backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Runtime Logs</h2>
      <p className="mt-1 text-sm text-slate-300">Request trace, status, and latency.</p>
      <ul className="mt-4 space-y-3">
        {logs.length === 0 ? (
          <li className="rounded-lg border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-400">No requests yet.</li>
        ) : (
          logs.map((log) => (
            <li
              key={log.traceId}
              className="rounded-lg border border-white/10 bg-slate-900/70 p-3 text-xs text-slate-200"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold uppercase tracking-[0.2em]">{log.status}</span>
                <span>{log.latencyMs ? `${log.latencyMs}ms` : "-"}</span>
              </div>
              <div className="mt-1 break-all text-[11px] text-slate-400">trace: {log.traceId}</div>
              <div className="mt-1 text-sm text-slate-100">{log.message}</div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
