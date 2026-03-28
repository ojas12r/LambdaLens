"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, Triangle, Gamepad2, CloudLightning, Lock, FlaskConical } from "lucide-react";

type Provider = "aws" | "vercel" | "mock";

interface SetupFormProps {
  initialMode?: string;
}

export function SetupForm({ initialMode }: SetupFormProps) {
  const router = useRouter();

  const [provider, setProvider] = useState<Provider>(
    initialMode === "mock" ? "mock" : "aws"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AWS fields
  const [awsKeyId, setAwsKeyId] = useState("");
  const [awsSecret, setAwsSecret] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");

  // Vercel fields
  const [vercelToken, setVercelToken] = useState("");
  const [vercelTeamId, setVercelTeamId] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // Validate required fields
    if (provider === "aws" && (!awsKeyId.trim() || !awsSecret.trim())) {
      setError("AWS Access Key ID and Secret Access Key are required.");
      setLoading(false);
      return;
    }
    if (provider === "vercel" && !vercelToken.trim()) {
      setError("Vercel API Token is required.");
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = { provider };

      if (provider === "aws") {
        body.credentials = {
          accessKeyId: awsKeyId.trim(),
          secretAccessKey: awsSecret.trim(),
          region: awsRegion,
        };
      } else if (provider === "vercel") {
        body.credentials = {
          apiToken: vercelToken.trim(),
          teamId: vercelTeamId.trim(),
        };
      }

      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Connection failed");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Provider; label: string; icon: React.ReactNode }[] = [
    { key: "aws", label: "AWS", icon: <img src="/aws-logo.avif" alt="AWS" className="w-6 h-6 object-contain opacity-90" /> },
    { key: "vercel", label: "Vercel", icon: <Triangle className="w-5 h-5 fill-current pt-0.5" /> },
    { key: "mock", label: "Demo", icon: <img src="/demo.avif" alt="Demo" className="w-6 h-6 object-contain opacity-90 brightness-0 invert" /> },
  ];

  return (
    <div 
      className="min-h-screen bg-[#0C0C0C] flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='rgba(255, 255, 255, 0.04)' stroke-width='3.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='rotate(-10 60 70)'%3E%3Cpath d='M30 40 L30 110 L100 110' /%3E%3Cpath d='M35 95 L55 60 L75 80 L95 40' /%3E%3C/g%3E%3Cg transform='rotate(15 320 80)'%3E%3Ccircle cx='320' cy='80' r='35' /%3E%3Ccircle cx='320' cy='80' r='18' /%3E%3Cpath d='M320 45 A35 35 0 0 1 355 80 L320 80 Z' fill='rgba(255, 255, 255, 0.02)' /%3E%3C/g%3E%3Cg transform='rotate(-20 50 200)'%3E%3Cpath d='M20 230 L50 200 L70 210 L100 170' /%3E%3Cpath d='M100 190 L100 170 L80 170' /%3E%3C/g%3E%3Cg transform='rotate(8 200 320)'%3E%3Cpath d='M150 270 L150 360 L240 360' /%3E%3Crect x='160' y='330' width='16' height='30' /%3E%3Crect x='188' y='290' width='16' height='70' /%3E%3Crect x='216' y='310' width='16' height='50' /%3E%3C/g%3E%3Cg transform='rotate(10 330 220)'%3E%3Ccircle cx='300' cy='190' r='4' /%3E%3Ccircle cx='350' cy='200' r='4' /%3E%3Ccircle cx='320' cy='250' r='4' /%3E%3Ccircle cx='370' cy='240' r='4' /%3E%3Cpath d='M304 192 L346 198' /%3E%3Cpath d='M303 194 L317 246' /%3E%3Cpath d='M350 204 L323 247' /%3E%3Cpath d='M353 203 L368 237' /%3E%3Cpath d='M324 250 L366 242' /%3E%3C/g%3E%3Cg transform='rotate(-5 200 80)'%3E%3Crect x='170' y='50' width='50' height='40' rx='4' /%3E%3Cline x1='170' y1='70' x2='220' y2='70' /%3E%3Cline x1='195' y1='50' x2='195' y2='90' /%3E%3C/g%3E%3Cg transform='rotate(15 60 320)'%3E%3Cline x1='50' y1='280' x2='50' y2='340' /%3E%3Crect x='42' y='295' width='16' height='25' fill='rgba(255, 255, 255, 0.02)' /%3E%3Cline x1='80' y1='300' x2='80' y2='360' /%3E%3Crect x='72' y='320' width='16' height='30' /%3E%3C/g%3E%3Cg transform='rotate(0 340 340)'%3E%3Ccircle cx='340' cy='340' r='25' /%3E%3Ccircle cx='340' cy='340' r='10' /%3E%3Cpath d='M340 315 L340 300' /%3E%3Cpath d='M340 365 L340 380' /%3E%3Cpath d='M315 340 L300 340' /%3E%3Cpath d='M365 340 L380 340' /%3E%3C/g%3E%3Cg transform='rotate(-12 180 180)'%3E%3Cpath d='M130 140 L130 220 L210 220' /%3E%3Ccircle cx='150' cy='200' r='2' /%3E%3Ccircle cx='160' cy='180' r='2' /%3E%3Ccircle cx='145' cy='160' r='2' /%3E%3Ccircle cx='180' cy='170' r='2' /%3E%3Ccircle cx='190' cy='150' r='2' /%3E%3Ccircle cx='200' cy='190' r='2' /%3E%3C/g%3E%3Cg stroke-width='2.5'%3E%3Cpath d='M 120 40 L 120 50 M 115 45 L 125 45' /%3E%3Cpath d='M 280 120 L 280 130 M 275 125 L 285 125' /%3E%3Cpath d='M 90 260 L 90 270 M 85 265 L 95 265' /%3E%3Cpath d='M 350 280 L 350 290 M 345 285 L 355 285' /%3E%3Ccircle cx='130' cy='110' r='1.5' /%3E%3Ccircle cx='150' cy='20' r='2' /%3E%3Ccircle cx='260' cy='60' r='1' /%3E%3Ccircle cx='380' cy='140' r='2.5' /%3E%3Ccircle cx='230' cy='150' r='1' /%3E%3Ccircle cx='90' cy='160' r='1.5' /%3E%3Ccircle cx='30' cy='140' r='2.5' /%3E%3Ccircle cx='150' cy='250' r='2' /%3E%3Ccircle cx='280' cy='220' r='1' /%3E%3Ccircle cx='250' cy='270' r='1.5' /%3E%3Ccircle cx='120' cy='380' r='2.5' /%3E%3Ccircle cx='380' cy='50' r='1.5' /%3E%3Ccircle cx='20' cy='280' r='2' /%3E%3Ccircle cx='350' cy='380' r='1' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '250px 250px'
      }}
    >
      <div className="w-full max-w-lg relative z-10">
        {/* Back link */}
        <a
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-white transition-colors bg-[#0C0C0C]/50 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm"
        >
          ← Back to home
        </a>

        <div className="rounded-2xl border border-slate-800 bg-[#101010]/95 shadow-2xl backdrop-blur-md p-8">
          {/* Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700">
              <CloudLightning className="w-6 h-6 text-aegis" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">
              Connect Your Cloud
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Choose a provider or explore with mock data
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex rounded-lg border border-slate-700 bg-[#0C0C0C] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setProvider(tab.key);
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                  provider === tab.key
                    ? "bg-aegis text-white shadow-lg shadow-aegis/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── AWS Form ── */}
          {provider === "aws" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={awsKeyId}
                  onChange={(e) => setAwsKeyId(e.target.value)}
                  placeholder="AKIA..."
                  className="w-full rounded-lg border border-slate-700 bg-[#0C0C0C] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-aegis focus:ring-1 focus:ring-aegis transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={awsSecret}
                  onChange={(e) => setAwsSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-[#0C0C0C] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-aegis focus:ring-1 focus:ring-aegis transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Region
                </label>
                <select
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#0C0C0C] px-4 py-2.5 text-sm text-white outline-none focus:border-aegis focus:ring-1 focus:ring-aegis transition-colors"
                >
                  {[
                    "us-east-1",
                    "us-east-2",
                    "us-west-1",
                    "us-west-2",
                    "eu-west-1",
                    "eu-central-1",
                    "ap-southeast-1",
                    "ap-northeast-1",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-300/80">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Credentials are stored in encrypted, HTTP-only cookies and are never persisted to any database. They are cleared when you disconnect.</span>
                </p>
              </div>
            </div>
          )}

          {/* ── Vercel Form ── */}
          {provider === "vercel" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  API Token
                </label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="Enter your Vercel API token"
                  className="w-full rounded-lg border border-slate-700 bg-[#0C0C0C] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-aegis focus:ring-1 focus:ring-aegis transition-colors"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Generate at{" "}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aegis-400 underline"
                  >
                    vercel.com/account/tokens
                  </a>
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Team ID{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={vercelTeamId}
                  onChange={(e) => setVercelTeamId(e.target.value)}
                  placeholder="team_..."
                  className="w-full rounded-lg border border-slate-700 bg-[#0C0C0C] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-aegis focus:ring-1 focus:ring-aegis transition-colors"
                />
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-300/80">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Your token is stored in an HTTP-only cookie and never logged or persisted to disk.</span>
                </p>
              </div>
            </div>
          )}

          {/* ── Mock/Demo ── */}
          {provider === "mock" && (
            <div className="rounded-lg border border-slate-700 bg-[#0C0C0C] p-6 flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700">
                <FlaskConical className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                Interactive Demo Mode
              </h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                Explore the full dashboard with realistic mock data — cost
                spikes, AI-generated root-cause analyses, and trace waterfalls.
                No credentials needed.
              </p>
              <ul className="mt-4 space-y-1.5 text-left text-sm text-slate-400 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <span className="text-aegis-400">✓</span> 5 sample
                  anomalies with investigations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aegis-400">✓</span> 24h cost data
                  across 7 functions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aegis-400">✓</span> Request trace
                  waterfall view
                </li>
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-aegis py-3 font-semibold text-white hover:bg-aegis-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Connecting…"
              : provider === "mock"
              ? "Launch Demo Dashboard →"
              : `Connect ${provider === "aws" ? "AWS" : "Vercel"} & Launch →`}
          </button>
        </div>
      </div>
    </div>
  );
}