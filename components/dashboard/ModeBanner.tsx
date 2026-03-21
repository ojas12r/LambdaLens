"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ModeBannerProps {
  provider: string;
}

const providerLabels: Record<string, { label: string; icon: string; color: string; dotColor: string }> = {
  mock: {
    label: "Demo Mode — viewing sample data",
    icon: "🧪",
    color: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    dotColor: "bg-amber-400",
  },
  aws: {
    label: "Connected to AWS",
    icon: "☁️",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    dotColor: "bg-emerald-400",
  },
  vercel: {
    label: "Connected to Vercel",
    icon: "▲",
    color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    dotColor: "bg-emerald-400",
  },
};

export function ModeBanner({ provider }: ModeBannerProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const info = providerLabels[provider] ?? providerLabels.mock;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/connect", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      setDisconnecting(false);
    }
  };

  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${info.color}`}>
      <div className="flex items-center gap-2.5">
        <span className={`inline-block h-2 w-2 rounded-full ${info.dotColor} animate-pulse`} />
        <span className="text-sm font-medium">{info.icon} {info.label}</span>
      </div>
      <div className="flex items-center gap-3">
        {provider === "mock" && (
          <a href="/setup" className="text-xs text-aegis-400 hover:text-aegis-300 transition-colors font-medium">
            Connect real account →
          </a>
        )}
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs text-slate-400 hover:text-red-300 disabled:opacity-50 transition-colors"
        >
          {disconnecting ? "…" : "Disconnect"}
        </button>
      </div>
    </div>
  );
}