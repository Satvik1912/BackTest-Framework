import { Link, useNavigate } from "react-router-dom"
import CandlestickBackdrop from "../components/CandlestickBackdrop"
import QuotesMarquee from "../components/QuotesMarquee"

type AppStatus = "LIVE" | "SOON"

type AppCard = {
  key: string
  name: string
  tagline: string
  description: string
  icon: string
  gradient: string
  status: AppStatus
  ctaLabel: string
  ctaHref?: string
  bullets: string[]
}

const APPS: AppCard[] = [
  {
    key: "backtest",
    name: "BackTest",
    tagline: "Test your trading ideas on years of market data.",
    description:
      "Combine indicators with simple AND / OR rules, run the strategy across NSE history, and see win rate, profit factor, drawdown, Sharpe and a full trade log in seconds.",
    icon: "📈",
    gradient: "from-blue-500 to-indigo-600",
    status: "LIVE",
    ctaLabel: "Explore BackTest",
    ctaHref: "/products/backtest",
    bullets: [
      "Eight built-in indicators",
      "Visual equity curve and trade-by-trade log",
      "Backtests run in a background worker pool",
    ],
  },
  {
    key: "autotrade",
    name: "AutoTrade",
    tagline: "Promote a backtested strategy to your live demat account.",
    description:
      "Connect your broker once and let your validated strategy place orders for you — with daily risk caps, position limits and a one-click kill switch built in.",
    icon: "🤖",
    gradient: "from-emerald-500 to-teal-600",
    status: "SOON",
    ctaLabel: "Coming soon",
    bullets: [
      "Plug-and-play broker connection",
      "Daily loss limits and position sizing rules",
      "Pause or stop with a single tap",
    ],
  },
  {
    key: "signals",
    name: "Live Signals",
    tagline: "Get a phone notification the moment your strategy triggers.",
    description:
      "Subscribe to any of your strategies and receive instant push alerts on entries, exits and stop hits — so you can act on the move even when you're away from the screen.",
    icon: "🔔",
    gradient: "from-fuchsia-500 to-rose-500",
    status: "SOON",
    ctaLabel: "Coming soon",
    bullets: [
      "Real-time entry, exit and stoploss alerts",
      "Per-strategy notification rules",
      "Works on Android and iOS",
    ],
  },
]

const FEATURES = [
  { icon: "🇮🇳", title: "Built for Indian markets", body: "Backtest NSE tickers like TATASTEEL.NS, RELIANCE.NS, INFY.NS." },
  { icon: "⏱️", title: "Asynchronous engine",       body: "Every backtest is queued to a worker pool — fire as many runs as you need." },
  { icon: "🧩", title: "Modular by design",          body: "Indicators today, automation and live signals coming next." },
  { icon: "🔐", title: "Private by default",         body: "Your strategies, jobs and results are scoped to your account only." },
]

const ROADMAP = [
  { quarter: "Available now",  title: "BackTest",     body: "Build, validate and iterate strategies on historical data.",      status: "LIVE" as AppStatus },
  { quarter: "Next up",        title: "AutoTrade",    body: "Move from paper to your live demat account with safety rails.",   status: "SOON" as AppStatus },
  { quarter: "On the roadmap", title: "Live Signals", body: "Push alerts whenever your conditions trigger on live data.",       status: "SOON" as AppStatus },
]

function smoothScrollTo(hash: string) {
  const el = document.querySelector(hash)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Top navigation */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <img
              src="/profit-life.png"
              alt="Profit Life"
              className="h-9 w-9 object-contain drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]"
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Profit Life
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#apps"
              onClick={(e) => { e.preventDefault(); smoothScrollTo("#apps") }}
              className="hidden sm:inline text-white/80 hover:text-white px-3 py-1.5 text-sm font-medium"
            >
              Our apps
            </a>
            <Link
              to="/login"
              className="text-white/90 hover:text-white px-3 py-1.5 text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-white text-slate-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero with candlestick backdrop */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.35),transparent_40%),radial-gradient(circle_at_75%_80%,rgba(168,85,247,0.25),transparent_45%)]"
        />
        <CandlestickBackdrop className="absolute inset-x-0 bottom-0 w-full h-[320px]" opacity={0.22} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 sm:pt-32 sm:pb-32 text-center">
          <img
            src="/profit-life.png"
            alt="Profit Life"
            className="mx-auto h-28 sm:h-32 w-auto object-contain drop-shadow-[0_0_45px_rgba(245,158,11,0.45)]"
          />
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-amber-300/30 px-3 py-1 text-xs font-medium text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            A growing suite of tools for systematic traders
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Make a life out of<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              your trading ideas.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-blue-100/90">
            Profit Life is your end-to-end workbench for systematic trading — research,
            automation and live alerts, all in one platform.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-950/30 transition"
            >
              Create your free account
            </Link>
            <a
              href="#apps"
              onClick={(e) => { e.preventDefault(); smoothScrollTo("#apps") }}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition"
            >
              Explore the apps
            </a>
          </div>
          <p className="mt-4 text-xs text-blue-200/70">
            Already with us? <Link to="/login" className="underline hover:text-white">Sign in</Link>
            <span className="mx-2 text-blue-200/40">·</span>
            Admin? <Link to="/admin/login" className="underline hover:text-white">Admin sign in</Link>
          </p>
        </div>
      </section>

      {/* Investor quotes marquee */}
      <QuotesMarquee />

      {/* Our apps */}
      <section id="apps" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Our apps
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            One platform, three tools for your trading workflow
          </h2>
          <p className="mt-3 text-gray-600">
            Start with research today, automate tomorrow, stay alerted in real time.
            Everything you build flows seamlessly from one app to the next.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => {
            const isLive = app.status === "LIVE"
            const goToApp = () => {
              if (isLive && app.ctaHref) navigate(app.ctaHref)
            }
            return (
              <div
                key={app.key}
                role={isLive ? "button" : undefined}
                tabIndex={isLive ? 0 : undefined}
                onClick={goToApp}
                onKeyDown={(e) => {
                  if (!isLive) return
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    goToApp()
                  }
                }}
                className={`relative bg-white rounded-3xl border ${
                  isLive ? "border-gray-200 cursor-pointer" : "border-gray-100"
                } overflow-hidden flex flex-col transition hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <div className={`h-2 bg-gradient-to-r ${app.gradient}`} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${app.gradient} text-white text-2xl flex items-center justify-center shadow-md`}
                    >
                      {app.icon}
                    </div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        Coming soon
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-gray-900">{app.name}</h3>
                  <p className="mt-1 text-sm font-medium text-gray-700">{app.tagline}</p>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{app.description}</p>

                  <ul className="mt-4 space-y-1.5">
                    {app.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className={`mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-br ${app.gradient}`} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    {isLive && app.ctaHref ? (
                      <Link
                        to={app.ctaHref}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center justify-center w-full bg-gradient-to-r ${app.gradient} text-white font-semibold px-4 py-2.5 rounded-xl shadow hover:opacity-95 transition`}
                      >
                        {app.ctaLabel} →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-gray-100 text-gray-500 font-semibold px-4 py-2.5 rounded-xl cursor-not-allowed"
                      >
                        {app.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Roadmap
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Where Profit Life is heading
          </h2>
          <p className="mt-3 text-gray-600">
            A clear path from researching ideas to running them live.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ROADMAP.map((r, idx) => (
            <div key={r.title} className="relative bg-white rounded-2xl border border-gray-200 p-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {r.quarter}
              </div>
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                {r.status === "LIVE" ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{r.body}</p>
              {idx < ROADMAP.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 h-0.5 w-6 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA with candlestick backdrop */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 sm:p-14 text-center shadow-xl overflow-hidden">
          <CandlestickBackdrop className="absolute inset-0 w-full h-full" opacity={0.15} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to put your first strategy to the test?
            </h2>
            <p className="mt-3 text-blue-100 max-w-xl mx-auto">
              Create a Profit Life account today — admin approval is quick, and you'll be
              running backtests in minutes. AutoTrade and Live Signals are landing next.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition">
                Create account
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/15 border border-white/30 font-semibold px-6 py-3 rounded-xl transition backdrop-blur-sm">
                I already have one
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-500">
        Profit Life · Educational use only · Not investment advice.
      </footer>
    </div>
  )
}
