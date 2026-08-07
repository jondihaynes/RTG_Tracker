import { createSiteConfig } from "@/lib/site-config";
import StorageProbeClient from "@/components/storage-probe-client";

export default function TestsPage() {
  const config = createSiteConfig();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.12),_transparent_32%),linear-gradient(135deg,_#0b0d10_0%,_#13161b_100%)] px-6 py-8 text-[#f4f1ea] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{config.appName}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Diagnostics</h1>
          <p className="mt-3 text-sm text-slate-400">Dedicated page for storage and connection tests.</p>
        </header>

        <StorageProbeClient />
      </div>
    </main>
  );
}
