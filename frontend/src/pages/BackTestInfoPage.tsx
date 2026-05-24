import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getIndicators } from "../api/strategies"
import { IndicatorMetadata } from "../types"
import CandlestickBackdrop from "../components/CandlestickBackdrop"
import QuotesMarquee from "../components/QuotesMarquee"

type CategoryStyle = { chip: string; iconBg: string; icon: string }

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  TREND:      { chip: "bg-blue-100 text-blue-800",       iconBg: "bg-blue-50 text-blue-600",       icon: "📈" },
  MOMENTUM:   { chip: "bg-purple-100 text-purple-800",   iconBg: "bg-purple-50 text-purple-600",   icon: "⚡" },
  VOLATILITY: { chip: "bg-orange-100 text-orange-800",   iconBg: "bg-orange-50 text-orange-600",   icon: "🌊" },
  PATTERN:    { chip: "bg-emerald-100 text-emerald-800", iconBg: "bg-emerald-50 text-emerald-600", icon: "🕯️" },
  VOLUME:     { chip: "bg-amber-100 text-amber-800",     iconBg: "bg-amber-50 text-amber-600",     icon: "📊" },
}
const FALLBACK_STYLE: CategoryStyle = {
  chip: "bg-gray-100 text-gray-800",
  iconBg: "bg-gray-50 text-gray-600",
  icon: "📐",
}

const FRIENDLY_DESCRIPTIONS: Record<string, string> = {
  RSI:         "Flags when a stock is overbought (likely to dip) or oversold (likely to bounce).",
  EMA:         "A trend line that reacts quickly to recent prices — handy for spotting trend shifts.",
  SMA:         "A smooth average of past prices that shows the overall direction of the market.",
  MACD:        "Compares two moving averages to flag momentum changes and potential entry signals.",
  BOLLINGER:   "Bands that expand and contract with volatility — touches at the edges can hint at reversals.",
  HAMMER:      "A single-candle pattern that often marks the end of a downtrend.",
  ENGULFING:   "A two-candle reversal pattern where today's candle completely 'eats' yesterday's.",
  VOLUME_MA:   "Average traded volume — spikes above it confirm strong moves.",
  SUPERTREND:  "A trend-following line that flips green/red when price breaks the volatility band.",
  ADX:         "Measures how strong a trend is — readings above 25 usually mean the market is really moving.",
  STOCHASTIC:  "Compares the close to its recent range; crossovers and OB/OS at 80/20 are the classic signals.",
  VWAP:        "The volume-weighted average price — traders use it as the 'fair value' anchor for the session.",
  DONCHIAN:    "Highest high / lowest low over N bars — a clean breakout signal when price punches through.",
  WILLIAMS_R:  "A momentum oscillator similar to Stochastic; below -80 oversold, above -20 overbought.",
  CCI:         "Spots strong moves away from the average — readings beyond ±100 mark powerful trends.",
  ROC:         "Pure percentage change over the lookback — fast read on whether momentum is building or fading.",
  MFI:         "Like RSI but volume-aware — a stronger signal when money is actually flowing in or out.",
  OBV:         "Cumulative volume flow; rising OBV with rising price confirms the trend's behind real buying.",
  KELTNER:     "An EMA-centered channel offset by ATR — closes hugging the upper band signal trend strength.",
  PSAR:        "Trailing dots that flip when price reverses — a classic stop-and-reverse trend follower.",
}

const STEPS = [
  { n: 1, icon: "👤", title: "Create your account", body: "Sign up free. An admin approves your account in a few minutes, and you're in." },
  { n: 2, icon: "🧱", title: "Build a strategy",    body: "Pick a ticker and timeframe, then stack indicators with AND / OR rules — no code, no spreadsheets." },
  { n: 3, icon: "🚀", title: "Run a backtest",      body: "One click sends the job to our worker pool; you can launch several runs in parallel." },
  { n: 4, icon: "📊", title: "Read the results",    body: "Win rate, profit factor, drawdown, Sharpe, every trade and a live equity curve — all in one view." },
]

export default function BackTestInfoPage() {
  const [indicators, setIndicators] = useState<IndicatorMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const stats = [
    { value: loading ? "…" : String(indicators.length || "20+"), label: "Built-in indicators" },
    { value: "AND / OR", label: "Condition logic" },
    { value: "NSE", label: "Indian equity markets" },
    { value: "Async", label: "Parallel worker engine" },
  ]

  useEffect(() => {
    getIndicators()
      .then(setIndicators)
      .catch(() => setError("Couldn't load indicator list — backend may be offline."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white">
            <img
              src="/profit-life.png"
              alt="Profit Life"
              className="h-9 w-9 object-contain drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]"
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Profit Life
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="text-white/80 hover:text-white px-3 py-1.5 text-sm font-medium">
              ← All apps
            </Link>
            <Link to="/login" className="text-white/90 hover:text-white px-3 py-1.5 text-sm font-medium">
              Sign in
            </Link>
            <Link to="/register" className="bg-white text-slate-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
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
        <CandlestickBackdrop className="absolute inset-x-0 bottom-0 w-full h-[280px]" opacity={0.2} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-32 sm:pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            App · BackTest
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Backtest your strategies on<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              years of market data.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-blue-100/90">
            Combine indicators with simple AND / OR rules. Run them across NSE history.
            See win rate, drawdown, Sharpe and a full trade log — all without writing a line of code.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto bg-white text-slate-900 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-950/30 transition">
              Create your free account
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Quotes marquee */}
      <QuotesMarquee />

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-gray-500 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gradient-to-b from-slate-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
              How it works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
              From idea to backtest in four steps
            </h2>
            <p className="mt-3 text-gray-600">
              No setup, no scripting. Build, run, read the results — that's it.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition">
                <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow">
                  {s.n}
                </div>
                <div className="text-3xl">{s.icon}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indicators */}
      <section id="indicators" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Indicators
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Tools you already know
          </h2>
          <p className="mt-3 text-gray-600">
            Combine any of these with AND / OR rules to define exactly when to enter a trade.
          </p>
        </div>

        {loading && <div className="mt-10 text-center text-sm text-gray-500">Loading indicators...</div>}
        {error && (
          <div className="mt-10 max-w-xl mx-auto p-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {indicators.map((ind) => {
              const style = CATEGORY_STYLES[ind.category] ?? FALLBACK_STYLE
              const friendly = FRIENDLY_DESCRIPTIONS[ind.key] ?? ind.description ?? ""
              return (
                <div key={ind.key} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200 transition flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl ${style.iconBg}`}>
                      {style.icon}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${style.chip}`}>
                      {ind.category}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900 text-lg">{ind.displayName}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed flex-1">{friendly}</p>
                  {ind.params && ind.params.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-1.5">
                        Parameters
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ind.params.map((p) => (
                          <span key={p.key} className="text-[11px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 sm:p-14 text-center shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to put your first strategy to the test?</h2>
          <p className="mt-3 text-blue-100 max-w-xl mx-auto">
            Create a Profit Life account today — admin approval is quick, and you'll be running backtests in minutes.
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
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-500">
        Profit Life · BackTest app · Educational use only · Not investment advice.
      </footer>
    </div>
  )
}
