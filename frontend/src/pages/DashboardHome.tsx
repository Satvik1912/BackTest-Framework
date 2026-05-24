import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

type Gradient =
  | "from-blue-500 to-indigo-600"
  | "from-purple-500 to-fuchsia-600"
  | "from-emerald-500 to-teal-600"
  | "from-rose-500 to-pink-600"
  | "from-amber-500 to-orange-600"
  | "from-indigo-500 to-blue-600"

const GLOW: Record<Gradient, string> = {
  "from-blue-500 to-indigo-600": "group-hover:shadow-blue-500/25",
  "from-purple-500 to-fuchsia-600": "group-hover:shadow-fuchsia-500/25",
  "from-emerald-500 to-teal-600": "group-hover:shadow-emerald-500/25",
  "from-rose-500 to-pink-600": "group-hover:shadow-rose-500/25",
  "from-amber-500 to-orange-600": "group-hover:shadow-amber-500/25",
  "from-indigo-500 to-blue-600": "group-hover:shadow-indigo-500/25",
}

const QUICK_ACTIONS: {
  to: string; icon: string; title: string; body: string; gradient: Gradient; cta: string
}[] = [
  {
    to: "/dashboard/strategies/new",
    icon: "➕",
    title: "Build a new strategy",
    body: "Pick a ticker, stack indicators, and define your rules in a few clicks.",
    gradient: "from-blue-500 to-indigo-600",
    cta: "Start building",
  },
  {
    to: "/dashboard/strategies",
    icon: "🗂️",
    title: "My strategies",
    body: "Edit, rerun or remove the strategies you have already saved.",
    gradient: "from-purple-500 to-fuchsia-600",
    cta: "Open list",
  },
  {
    to: "/dashboard/jobs",
    icon: "📊",
    title: "Backtest results",
    body: "Track running jobs and dive into the equity curves of your finished runs.",
    gradient: "from-emerald-500 to-teal-600",
    cta: "View jobs",
  },
]

const DATA_LIMITS: {
  label: string; icon: string; intervals: string[]; headline: string; sub: string; note: string; gradient: Gradient; chipBg: string
}[] = [
  {
    label: "Ultra-short",
    icon: "⚡",
    intervals: ["1m"],
    headline: "7 days",
    sub: "rolling window",
    note: "Tightest cap — use only for the most recent intraday studies.",
    gradient: "from-rose-500 to-pink-600",
    chipBg: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    label: "Intraday",
    icon: "📊",
    intervals: ["2m", "5m", "15m", "30m", "90m"],
    headline: "60 days",
    sub: "rolling window",
    note: "Standard intraday window for short-term strategy research.",
    gradient: "from-amber-500 to-orange-600",
    chipBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    label: "Hourly",
    icon: "🕐",
    intervals: ["1h", "60m"],
    headline: "~2 years",
    sub: "730 days max",
    note: "Best fit for multi-month intraday backtests.",
    gradient: "from-indigo-500 to-blue-600",
    chipBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    label: "Daily +",
    icon: "📈",
    intervals: ["1d", "5d", "1wk", "1mo", "3mo"],
    headline: "Full history",
    sub: "since listing",
    note: "Use for long-horizon backtests — back to a ticker's IPO when Yahoo has it.",
    gradient: "from-emerald-500 to-teal-600",
    chipBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
]

const COMING_SOON = [
  {
    icon: "🤖",
    title: "AutoTrade",
    body: "Promote a backtested strategy to your live demat account with risk caps and a kill switch.",
    accent: "from-purple-500/10 to-fuchsia-500/10",
  },
  {
    icon: "🔔",
    title: "Live Signals",
    body: "Get instant push alerts on your phone the moment a strategy condition triggers.",
    accent: "from-blue-500/10 to-cyan-500/10",
  },
]

function SectionHeader({ title, sub, badge, badgeTone = "slate" }: {
  title: string
  sub?: string
  badge?: string
  badgeTone?: "slate" | "amber"
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-700 bg-slate-100 border-slate-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
  }
  return (
    <div className="flex items-end justify-between mb-4 gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {badge && (
        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${tones[badgeTone]}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default function DashboardHome() {
  const { user } = useAuth()
  const inboxName = user?.email ? user.email.split("@")[0] : "trader"

  return (
    <div className="space-y-10">

      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl shadow-indigo-900/20 ring-1 ring-white/5">
        {/* Soft radial highlights */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.35),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(168,85,247,0.3),transparent_50%)]"
        />
        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:40px_40px]"
        />
        {/* Floating accent blob */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/20 blur-3xl"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Workspace · live
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight">
            Welcome back,{" "}
            <span className="capitalize bg-gradient-to-r from-blue-200 via-sky-100 to-indigo-200 bg-clip-text text-transparent">
              {inboxName}
            </span>
          </h1>
          <p className="mt-3 text-blue-100/80 max-w-xl text-base leading-relaxed">
            Ready to put another idea on trial? Build a fresh strategy, rerun an old one,
            or open the latest backtest and see how it performed.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/dashboard/strategies/new"
              className="group inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all"
            >
              <span className="text-base leading-none">+</span> New strategy
              <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
            </Link>
            <Link
              to="/dashboard/jobs"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-sm transition-colors"
            >
              View backtests
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <SectionHeader title="Quick actions" sub="Jump straight into the most common workflows." />
        <div className="grid gap-5 md:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl ${GLOW[a.gradient]}`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${a.gradient}`} />
              {/* Subtle hover glow background */}
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
              <div className="relative p-6 flex flex-col flex-1">
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${a.gradient} text-white text-xl flex items-center justify-center shadow-lg ${GLOW[a.gradient]} transition-shadow`}
                >
                  {a.icon}
                </div>
                <h3 className="mt-5 font-semibold text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">
                  {a.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed flex-1">
                  {a.body}
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  {a.cta}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Data availability (yfinance) */}
      <section>
        <SectionHeader
          title="Historical data availability"
          sub="How far back you can pull data, by candle interval."
          badge="Yahoo Finance limits"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DATA_LIMITS.map((bucket) => (
            <div
              key={bucket.label}
              className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl ${GLOW[bucket.gradient]}`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${bucket.gradient}`} />
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${bucket.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
              <div className="relative p-5 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${bucket.gradient} text-white text-lg flex items-center justify-center shadow-lg`}
                  >
                    {bucket.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {bucket.label}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
                    {bucket.headline}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{bucket.sub}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {bucket.intervals.map((iv) => (
                    <span
                      key={iv}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${bucket.chipBg}`}
                    >
                      {iv}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-xs text-gray-600 leading-relaxed flex-1">{bucket.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-5">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-300/20 blur-2xl"
          />
          <div className="relative flex gap-4">
            <div className="h-9 w-9 rounded-xl bg-white text-blue-700 text-base flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
              ℹ
            </div>
            <div className="text-xs text-blue-950/85 space-y-1.5 leading-relaxed">
              <p><span className="font-semibold text-blue-900">Rolling windows</span> are measured from today, not absolute dates — so a 7-day 1m window always means "the last 7 days."</p>
              <p><span className="font-semibold text-blue-900">period="max"</span> still respects each interval's cap — e.g. <code className="font-mono text-[11px] bg-white/80 text-blue-900 px-1.5 py-0.5 rounded border border-blue-100">1m + max</code> still returns 7 days.</p>
              <p>If you pick a start date older than the cap allows, Yahoo silently returns only what fits — no error is raised.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section>
        <SectionHeader title="Coming next to your workspace" badge="In progress" badgeTone="amber" />
        <div className="grid gap-5 md:grid-cols-2">
          {COMING_SOON.map((c) => (
            <div
              key={c.title}
              className="group relative bg-white rounded-2xl border border-dashed border-slate-300 p-6 overflow-hidden hover:border-slate-400 transition-colors"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${c.accent} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                  {c.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 tracking-tight">{c.title}</h3>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
