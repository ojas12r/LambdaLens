import Link from "next/link";
import Image from "next/image";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { AnimatedLine } from "@/components/AnimatedLine";

/* ───────────────────────── Feature data ───────────────────────── */
const features = [
  {
    icon: "🤖",
    title: "AI-Powered Detection",
    desc: "Gemini-powered agent automatically detects billing anomalies and correlates them with infrastructure events.",
  },
  {
    icon: "🔬",
    title: "Root Cause Analysis",
    desc: "Reads CloudWatch logs, traces retries, and identifies exactly which code path caused the cost spike.",
  },
  {
    icon: "📊",
    title: "Real-time Dashboards",
    desc: "Live cost distribution charts, anomaly timelines, and request trace waterfalls — all server-rendered.",
  },
  {
    icon: "💡",
    title: "Actionable Fixes",
    desc: "Every finding includes specific remediation steps: code changes, config tweaks, and architecture recommendations.",
  },
  {
    icon: "☁️",
    title: "Multi-Cloud Ready",
    desc: "Connect AWS (Athena + CloudWatch) or Vercel — with a plug-in architecture for GCP and Azure.",
  },
  {
    icon: "🔄",
    title: "Trace Visualization",
    desc: "Waterfall view of request traces shows exactly where time (and money) is being spent.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect",
    desc: "Paste your AWS or Vercel API key. We never store credentials on disk — they live in encrypted, HTTP-only cookies for the session.",
  },
  {
    num: "02",
    title: "Detect",
    desc: "Our agent queries Athena for billing spikes, pulls CloudWatch logs, and searches a vector DB of past incidents for patterns.",
  },
  {
    num: "03",
    title: "Resolve",
    desc: "You get a root-cause summary, supporting evidence, estimated impact, and a copy-paste fix — in seconds, not hours.",
  },
];

/* ───────────────────────── Page ───────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0C] text-white font-gnomon">
      {/* ── Nav ── */}
      <nav className="fixed top-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl -translate-x-1/2 rounded-full border border-slate-800/60 bg-[#0C0C0C]/60 backdrop-blur-xl shadow-2xl">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/aegis-logo.avif"
              alt="Aegis"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
            <span className="text-xl font-medium text-white tracking-tight">Aegis</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-base text-slate-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-base text-slate-400 hover:text-white transition-colors">
              How It Works
            </a>
            <Link
              href="/setup"
              className="rounded-lg bg-aegis-700 px-5 py-2.5 text-base tracking-wide hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link
            href="/setup"
            className="rounded-lg bg-aegis-700 px-5 py-2.5 text-base tracking-wide hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300 md:hidden"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-16 px-6">
        <div className="hero-glow" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-aegis/20 bg-aegis/10 px-3 py-1 text-sm text-aegis-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-aegis-400" />
            AI-Powered Cloud Cost Intelligence
          </div>

          {/* Headline */}
          <h1 className="text-5xl leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Find the spike.
            <br />
            <span className="animate-gradient bg-gradient-to-r from-aegis-300 via-emerald-400 to-aegis-300 bg-clip-text text-transparent">
              Fix the cause.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
            Aegis monitors your serverless costs 24/7, pinpoints
            anomalies, reads the logs, and tells you exactly what broke —
            and how to fix it.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/setup?mode=mock"
              className="rounded-lg bg-white px-8 py-4 text-center tracking-wide text-xl text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Try Live Demo →
            </Link>
            <Link
              href="/setup"
              className="rounded-lg border border-aegis-600 bg-aegis-700 px-8 py-4 text-center tracking-wide text-xl hover:bg-aegis-600 transition-colors"
            >
              Connect Your Cloud
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-16">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-aegis/10 via-transparent to-transparent blur-2xl" />
            <div className="relative rounded-xl border border-slate-800 bg-[#101010] shadow-2xl shadow-aegis/10 overflow-hidden">
              <Image
                src="/dashboard-preview.avif"
                alt="Aegis Dashboard"
                width={1280}
                height={665}
                className="w-full h-auto"
                priority
              />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0C0C0C] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-800/60 bg-[#0C0C0C]/40">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 text-center md:grid-cols-4">
          {[
            ["$2.4M+", "Cloud spend monitored"],
            ["1,200+", "Anomalies resolved"],
            ["< 30s", "Avg. detection time"],
            ["92%", "Root-cause accuracy"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-3xl text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl">
              Everything you need to tame cloud costs
            </h2>
            <p className="mt-3 text-slate-400">
              From detection to resolution — fully automated.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <CardSpotlight
                key={f.title}
                color="transparent"
                className="relative h-[300px] w-full overflow-hidden rounded-[2.5rem] border border-slate-800/80 p-0"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(12,12,12,1) 40%, rgba(12,12,12,0.85) 75%, rgba(12,12,12,0) 100%), url('/card.avif')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* Seamless inner text container */}
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-10 transition-transform">
                  <h3 className="text-2xl text-white leading-tight w-4/5">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-slate-400 pr-2 sm:pr-6">
                    {f.desc}
                  </p>
                </div>
              </CardSpotlight>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="border-t border-slate-800/60 bg-[#0C0C0C]/30 py-24 px-6"
      >
        <div className="mx-auto max-w-5xl relative z-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl">
              Three steps to cost clarity
            </h2>
            <p className="mt-3 text-slate-400">
              Up and running in under two minutes.
            </p>
          </div>

          <div className="mt-16 relative">
            <AnimatedLine />

            {/* Smart mask overlay to hide tracing line solely in the 40px gaps */}
            <div className="absolute inset-0 hidden md:grid grid-cols-3 gap-10 z-30 pointer-events-none">
              <div className="relative">
                <div className="absolute -right-10 top-0 bottom-0 w-10 bg-[#0C0C0C]" />
              </div>
              <div className="relative">
                <div className="absolute -right-10 top-0 bottom-0 w-10 bg-[#0C0C0C]" />
              </div>
              <div className="relative" />
            </div>

            <div className="grid gap-10 md:grid-cols-3 relative z-10">
              {steps.map((s) => (
                <div 
                  key={s.num} 
                  className="relative group rounded-3xl border border-slate-800/80 bg-[#0C0C0C] shadow-2xl transition-all hover:-translate-y-1 hover:border-emerald-900/50 min-h-[380px] p-8 flex flex-col justify-end overflow-hidden"
                >
                  {/* Majestic Ambient Glow Blooms */}
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none transition-colors duration-700 group-hover:bg-emerald-500/25" />
                  <div className="absolute top-[-10%] -left-16 w-56 h-56 bg-teal-500/5 rounded-full blur-3xl pointer-events-none transition-colors duration-700 group-hover:bg-teal-500/10" />

                  {/* Content safely lifted above blooms */}
                  <div className="relative z-10">
                    <span className="text-5xl font-medium text-emerald-500/20">
                      {s.num}
                    </span>
                    <h3 className="mt-4 text-xl font-medium text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl leading-tight">
            Ready to stop overpaying?
          </h2>
          <p className="mt-6 text-xl md:text-2xl text-slate-400">
            Start with our interactive demo — no cloud credentials required.
          </p>
          <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <Link
              href="/setup?mode=mock"
              className="w-full rounded-lg bg-white px-8 py-4 tracking-wide text-xl text-slate-900 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 sm:w-auto"
            >
              Launch Demo Dashboard
            </Link>
            <Link
              href="/setup"
              className="w-full rounded-lg border border-slate-600 px-8 py-4 tracking-wide text-xl text-white hover:border-emerald-500 hover:bg-slate-800 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 sm:w-auto"
            >
              Connect Real Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 py-10 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-slate-500">
            <Image
              src="/aegis-logo.avif"
              alt="Aegis"
              width={80}
              height={22}
              className="h-5 w-auto opacity-60"
            />
            <span className="text-base">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex gap-6 text-base text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <Link href="/setup" className="hover:text-white transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
