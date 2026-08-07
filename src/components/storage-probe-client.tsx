"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

export default function StorageProbeClient() {
  const [probeRunning, setProbeRunning] = useState(false);
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [probeOk, setProbeOk] = useState<boolean | null>(null);

  const runStorageProbe = useCallback(async () => {
    setProbeRunning(true);
    setProbeMessage(null);
    setProbeOk(null);

    try {
      const response = await fetch("/api/state", { method: "PATCH", cache: "no-store" });
      const payload = await response.json();
      const message = typeof payload?.message === "string" ? payload.message : "Storage probe completed.";
      setProbeMessage(message);
      setProbeOk(response.ok);
    } catch {
      setProbeMessage("Storage probe failed to complete.");
      setProbeOk(false);
    } finally {
      setProbeRunning(false);
    }
  }, []);

  return (
    <section className="rounded-[2rem] border border-cyan-400/20 bg-[#12151a]/90 p-8 shadow-2xl shadow-black/20 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Storage diagnostics</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Redis / Upstash probe</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Use this page to verify the shared storage backend configured in your local environment.
          </p>
        </div>
        <button
          type="button"
          onClick={runStorageProbe}
          disabled={probeRunning}
          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {probeRunning ? "Checking…" : "Run probe"}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0f1115] p-5 text-sm text-slate-300">
        {probeMessage ? (
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Result</p>
            <p className={`mt-2 font-medium ${probeOk ? "text-emerald-300" : "text-rose-300"}`}>
              {probeMessage}
            </p>
          </>
        ) : (
          <p className="text-slate-400">No probe has been run yet.</p>
        )}
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
          ← Back to the tracker
        </Link>
      </div>
    </section>
  );
}
