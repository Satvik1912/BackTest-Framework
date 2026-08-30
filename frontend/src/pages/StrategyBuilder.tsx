import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  createStrategy,
  getIndicators,
  runBacktest
} from "../api/strategies"
import {
  Direction,
  IndicatorCondition,
  IndicatorMetadata,
  Strategy,
  StrategyDefinition
} from "../types"
import { operatorLabel } from "../lib/format"

type SlType = "SWING_LOW" | "ATR_MULTIPLE" | "FIXED_PCT" | "CHANDELIER_EXIT"
type TargetType = "R_MULTIPLE" | "FIXED_PCT" | "ATR_MULTIPLE" | "PRIOR_SWING_HIGH"
type Logic = "AND" | "OR"

const CATEGORIES = ["TREND", "MOMENTUM", "VOLATILITY", "PATTERN", "VOLUME"] as const
const INTERVALS = ["1m", "5m", "15m", "1h", "1d"]
const PERIODS = ["7d", "30d", "60d", "6mo", "1y"]
const MAX_TICKERS = 5

const PATTERN_OPERATORS = ["EQUALS"]
const STANDARD_OPERATORS = ["CROSSES_ABOVE", "CROSSES_BELOW", "OVER", "UNDER"]

const CATEGORY_META: Record<string, { dot: string; chip: string; ring: string; icon: string }> = {
  TREND:      { dot: "bg-indigo-500",  chip: "bg-indigo-50 text-indigo-700 border-indigo-200",   ring: "hover:border-indigo-300 hover:bg-indigo-50/60",  icon: "📈" },
  MOMENTUM:   { dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200",      ring: "hover:border-amber-300 hover:bg-amber-50/60",    icon: "⚡" },
  VOLATILITY: { dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200",         ring: "hover:border-rose-300 hover:bg-rose-50/60",      icon: "🌊" },
  PATTERN:    { dot: "bg-purple-500",  chip: "bg-purple-50 text-purple-700 border-purple-200",   ring: "hover:border-purple-300 hover:bg-purple-50/60",  icon: "🕯" },
  VOLUME:     { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200",ring: "hover:border-emerald-300 hover:bg-emerald-50/60",icon: "📊" },
}

function ConfigGroup({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pt-4 first:pt-0 border-t first:border-t-0 border-slate-100">
      <div>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}

export default function StrategyBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const editingStrategy = (location.state as { strategy?: Strategy } | null)?.strategy

  const [indicators, setIndicators] = useState<IndicatorMetadata[]>([])
  const [conditions, setConditions] = useState<IndicatorCondition[]>([])
  const [logic, setLogic] = useState<Logic>("AND")

  const [name, setName] = useState("")
  const [tickers, setTickers] = useState<string[]>([])
  const [tickerInput, setTickerInput] = useState("")
  const [interval, setIntervalValue] = useState("5m")
  const [period, setPeriod] = useState("60d")
  const [rr, setRr] = useState(2.0)
  const [direction, setDirection] = useState<Direction>("LONG")
  const [slType, setSlType] = useState<SlType>("SWING_LOW")
  const [slLookback, setSlLookback] = useState(5)
  const [atrMultiple, setAtrMultiple] = useState(1.5)
  const [slPct, setSlPct] = useState(1.5)
  const [chandelierMultiple, setChandelierMultiple] = useState(3.0)
  const [chandelierPeriod, setChandelierPeriod] = useState(22)
  const [targetType, setTargetType] = useState<TargetType>("R_MULTIPLE")
  const [targetPct, setTargetPct] = useState(3.0)
  const [targetAtrMultiple, setTargetAtrMultiple] = useState(2.0)
  const [targetSwingLookback, setTargetSwingLookback] = useState(20)
  const [maxBarsInTrade, setMaxBarsInTrade] = useState<number | "">("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadingIndicators, setLoadingIndicators] = useState(true)

  useEffect(() => {
    getIndicators()
      .then(setIndicators)
      .catch((err) => setError(extractMessage(err, "Failed to load indicators")))
      .finally(() => setLoadingIndicators(false))
  }, [])

  useEffect(() => {
    if (!editingStrategy) return
    setName(editingStrategy.name)
    setTickers(
      editingStrategy.tickers && editingStrategy.tickers.length > 0
        ? editingStrategy.tickers
        : editingStrategy.ticker
          ? [editingStrategy.ticker]
          : []
    )
    setIntervalValue(editingStrategy.interval)
    setPeriod(editingStrategy.period)
    setRr(editingStrategy.rr)
    setDirection(editingStrategy.direction === "SHORT" ? "SHORT" : "LONG")
    setLogic(editingStrategy.conditionLogic === "OR" ? "OR" : "AND")
    setConditions(editingStrategy.entryConditions)

    if (editingStrategy.slType) setSlType(editingStrategy.slType as SlType)
    if (editingStrategy.slLookback != null) setSlLookback(editingStrategy.slLookback)
    if (editingStrategy.atrMultiple != null) setAtrMultiple(editingStrategy.atrMultiple)
    if (editingStrategy.slPct != null) setSlPct(editingStrategy.slPct)
    if (editingStrategy.chandelierMultiple != null) setChandelierMultiple(editingStrategy.chandelierMultiple)
    if (editingStrategy.chandelierPeriod != null) setChandelierPeriod(editingStrategy.chandelierPeriod)
    if (editingStrategy.targetType) setTargetType(editingStrategy.targetType as TargetType)
    if (editingStrategy.targetPct != null) setTargetPct(editingStrategy.targetPct)
    if (editingStrategy.targetAtrMultiple != null) setTargetAtrMultiple(editingStrategy.targetAtrMultiple)
    if (editingStrategy.targetSwingLookback != null) setTargetSwingLookback(editingStrategy.targetSwingLookback)
    setMaxBarsInTrade(editingStrategy.maxBarsInTrade ?? "")
  }, [editingStrategy])

  const indicatorMap = useMemo(() => {
    const map: Record<string, IndicatorMetadata> = {}
    indicators.forEach((i) => { map[i.key] = i })
    return map
  }, [indicators])

  const grouped = useMemo(() => {
    const g: Record<string, IndicatorMetadata[]> = {
      TREND: [], MOMENTUM: [], VOLATILITY: [], PATTERN: [], VOLUME: []
    }
    indicators.forEach((i) => {
      if (g[i.category]) g[i.category].push(i)
    })
    return g
  }, [indicators])

  const addTicker = () => {
    const sym = tickerInput.trim().toUpperCase()
    if (!sym) return
    if (tickers.includes(sym)) { setTickerInput(""); return }
    if (tickers.length >= MAX_TICKERS) {
      setError(`You can analyze at most ${MAX_TICKERS} stocks at once`)
      return
    }
    setError("")
    setTickers([...tickers, sym])
    setTickerInput("")
  }

  const removeTicker = (sym: string) => setTickers(tickers.filter((t) => t !== sym))

  const addCondition = (ind: IndicatorMetadata) => {
    const params: Record<string, number | string> = {}
    ind.params.forEach((p) => { params[p.key] = p.defaultValue })
    // Sensible starting operator + threshold so the first strategy is runnable:
    // patterns just need to appear; threshold indicators start at their natural
    // level (e.g. RSI 30); signal-based indicators ignore the threshold.
    const operator = ind.category === "PATTERN" ? "EQUALS" : "CROSSES_ABOVE"
    const threshold = ind.category === "PATTERN" ? 1 : ind.usesThreshold ? ind.defaultThreshold : 0
    setConditions([...conditions, { indicatorKey: ind.key, params, operator, threshold }])
  }

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx))
  }

  const updateCondition = (idx: number, patch: Partial<IndicatorCondition>) => {
    setConditions(conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const updateConditionParam = (idx: number, key: string, value: number) => {
    setConditions(conditions.map((c, i) =>
      i === idx ? { ...c, params: { ...c.params, [key]: value } } : c
    ))
  }

  const buildDefinition = (): StrategyDefinition | null => {
    setError("")
    setSuccess("")
    // Fold any half-typed symbol still in the input box into the list.
    const pending = tickerInput.trim().toUpperCase()
    const effectiveTickers =
      pending && !tickers.includes(pending) && tickers.length < MAX_TICKERS
        ? [...tickers, pending]
        : tickers
    if (!name.trim()) { setError("Strategy name is required"); return null }
    if (effectiveTickers.length === 0) { setError("Add at least one stock (ticker)"); return null }
    if (effectiveTickers.length > MAX_TICKERS) {
      setError(`You can analyze at most ${MAX_TICKERS} stocks at once`)
      return null
    }
    if (conditions.length === 0) {
      setError("Add at least one entry condition")
      return null
    }
    setTickers(effectiveTickers)
    setTickerInput("")
    const maxBars = typeof maxBarsInTrade === "number" && maxBarsInTrade > 0 ? maxBarsInTrade : undefined
    return {
      name: name.trim(),
      ticker: effectiveTickers[0],
      tickers: effectiveTickers,
      interval,
      period,
      rr,
      direction,
      slType,
      slLookback: slType === "SWING_LOW" ? slLookback : undefined,
      atrMultiple: slType === "ATR_MULTIPLE" ? atrMultiple : undefined,
      slPct: slType === "FIXED_PCT" ? slPct : undefined,
      chandelierMultiple: slType === "CHANDELIER_EXIT" ? chandelierMultiple : undefined,
      chandelierPeriod: slType === "CHANDELIER_EXIT" ? chandelierPeriod : undefined,
      targetType,
      targetPct: targetType === "FIXED_PCT" ? targetPct : undefined,
      targetAtrMultiple: targetType === "ATR_MULTIPLE" ? targetAtrMultiple : undefined,
      targetSwingLookback: targetType === "PRIOR_SWING_HIGH" ? targetSwingLookback : undefined,
      maxBarsInTrade: maxBars,
      conditionLogic: logic,
      entryConditions: conditions,
      exitConditions: []
    }
  }

  const handleSave = async () => {
    const def = buildDefinition()
    if (!def) return
    setSaving(true)
    try {
      const saved = await createStrategy(def)
      setSuccess(`Saved "${saved.name}"`)
    } catch (err) {
      setError(extractMessage(err, "Failed to save strategy"))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndRun = async () => {
    const def = buildDefinition()
    if (!def) return
    setSaving(true)
    try {
      const saved = await createStrategy(def)
      const job = await runBacktest(saved.id)
      navigate(`/dashboard/jobs/${job.jobId}`)
    } catch (err) {
      setError(extractMessage(err, "Failed to save and run"))
      setSaving(false)
    }
  }

  const totalIndicators = indicators.length
  const isEditing = !!editingStrategy

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white px-6 py-5 shadow-lg ring-1 ring-white/5">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-100 uppercase tracking-wider backdrop-blur-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${isEditing ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`} />
              {isEditing ? "Editing" : "New strategy"}
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight">Strategy Builder</h1>
            <p className="text-xs text-blue-100/70 mt-0.5">
              Stack indicators on the left, tune the trade plan on the right, then save & run.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/60">Conditions</div>
              <div className="font-semibold text-white">{conditions.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-blue-100/60">Library</div>
              <div className="font-semibold text-white">{totalIndicators}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Indicator Library</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {totalIndicators}
          </span>
        </div>
        {loadingIndicators && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const items = grouped[cat] || []
          if (items.length === 0) return null
          return (
            <div key={cat} className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {cat}
                </h3>
                <span className="text-[10px] font-medium text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map((ind) => (
                  <button
                    key={ind.key}
                    type="button"
                    onClick={() => addCondition(ind)}
                    className={`group w-full text-left p-2.5 rounded-lg border border-transparent transition-colors ${meta.ring}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-950">{ind.displayName}</div>
                      <span className="ml-auto text-[10px] font-medium text-slate-300 group-hover:text-slate-500 transition-colors">+</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">{ind.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </aside>

      <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Entry Conditions</h2>
            <p className="text-xs text-slate-500 mt-0.5">All must pass on the same bar to fire an entry.</p>
          </div>
          {conditions.length > 0 && (
            <span className="text-xs font-medium text-slate-500">
              {conditions.length} {conditions.length === 1 ? "condition" : "conditions"}
            </span>
          )}
        </div>

        {conditions.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl shadow-lg shadow-blue-500/20 mb-4">
              ←
            </div>
            <p className="text-sm font-medium text-slate-700">Pick an indicator on the left</p>
            <p className="text-xs text-slate-400 mt-1">Each indicator becomes a rule that must trigger to enter a trade.</p>
          </div>
        )}

        <div className="space-y-3">
          {conditions.map((cond, idx) => {
            const ind = indicatorMap[cond.indicatorKey]
            if (!ind) {
              return (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 text-sm text-slate-400 animate-pulse">
                  Loading {cond.indicatorKey}…
                </div>
              )
            }
            const operators = ind.category === "PATTERN" ? PATTERN_OPERATORS : STANDARD_OPERATORS
            const isPattern = ind.category === "PATTERN"
            const showThreshold = !isPattern && ind.usesThreshold
            const signalBased = !isPattern && !ind.usesThreshold
            const meta = CATEGORY_META[ind.category] ?? CATEGORY_META.TREND
            return (
              <div key={idx} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all">
                <div className={`h-1 ${meta.dot}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-semibold">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 truncate">{ind.displayName}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${meta.chip}`}>
                        {ind.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="text-xs text-slate-400 hover:text-red-600 font-medium opacity-60 group-hover:opacity-100 transition-all"
                      aria-label="Remove condition"
                    >
                      ✕
                    </button>
                  </div>
                  {ind.description && (
                    <p className="text-xs text-slate-500 mb-3 leading-snug">{ind.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Condition</label>
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                      >
                        {operators.map((op) => (
                          <option key={op} value={op}>{operatorLabel(op)}</option>
                        ))}
                      </select>
                    </div>
                    {showThreshold && (
                      <div>
                        <label
                          className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1"
                          title={ind.thresholdHelp}
                        >
                          {ind.thresholdLabel}
                        </label>
                        <input
                          type="number"
                          value={cond.threshold}
                          min={ind.thresholdMin ?? undefined}
                          max={ind.thresholdMax ?? undefined}
                          onChange={(e) => updateCondition(idx, { threshold: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    )}
                    {ind.params.map((p) => (
                      <div key={p.key}>
                        <label
                          className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1"
                          title={p.help}
                        >
                          {p.label}
                        </label>
                        <input
                          type="number"
                          value={cond.params[p.key] ?? ""}
                          min={p.min}
                          max={p.max}
                          step={p.type === "FLOAT" ? 0.1 : 1}
                          onChange={(e) => {
                            const raw = e.target.value
                            const parsed = p.type === "FLOAT" ? parseFloat(raw) : parseInt(raw, 10)
                            updateConditionParam(idx, p.key, Number.isFinite(parsed) ? parsed : 0)
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    ))}
                  </div>

                  {showThreshold && (ind.thresholdHelp || ind.thresholdSuggestions.length > 0) && (
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                      {ind.thresholdHelp && (
                        <p className="text-[11px] text-slate-500 leading-snug">{ind.thresholdHelp}</p>
                      )}
                      {ind.thresholdSuggestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">
                            Try:
                          </span>
                          {ind.thresholdSuggestions.map((s) => (
                            <button
                              type="button"
                              key={s.label}
                              onClick={() => updateCondition(idx, { threshold: s.value })}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
                                cond.threshold === s.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                              }`}
                            >
                              {s.label} · {s.value}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {signalBased && (
                    <p className="mt-2 text-[11px] text-slate-400 leading-snug">
                      Signal-based indicator — it fires on its own crossover, so there's no level to set.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {conditions.length > 1 && (
          <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Combine conditions with</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setLogic("AND")}
                className={`px-3 py-1 text-xs font-semibold transition-all ${logic === "AND" ? "bg-blue-600 text-white shadow-inner" : "text-slate-600 hover:bg-slate-50"}`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => setLogic("OR")}
                className={`px-3 py-1 text-xs font-semibold transition-all ${logic === "OR" ? "bg-blue-600 text-white shadow-inner" : "text-slate-600 hover:bg-slate-50"}`}
              >
                OR
              </button>
            </div>
            <span className="text-[11px] text-slate-400 ml-auto">{logic === "AND" ? "All must pass" : "Any one fires"}</span>
          </div>
        )}
      </section>

      <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Backtest Config</h2>

        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex gap-2">
            <span className="font-bold">!</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex gap-2">
            <span className="font-bold">✓</span><span>{success}</span>
          </div>
        )}

        <div className="space-y-1">

          <ConfigGroup title="Trade Direction">
            <div>
              <div className="inline-flex w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setDirection("LONG")}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold transition-all ${
                    direction === "LONG"
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  ↑ Long
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("SHORT")}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold transition-all ${
                    direction === "SHORT"
                      ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  ↓ Short
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                {direction === "LONG"
                  ? "Buy at entry; SL below, target above."
                  : "Sell at entry; SL above, target below."}
              </p>
            </div>
          </ConfigGroup>

          <ConfigGroup title="Setup">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Strategy Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder="e.g. RSI Reversal"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Stocks
                </label>
                <span className="text-[10px] text-slate-400">{tickers.length}/{MAX_TICKERS}</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTicker() }
                  }}
                  disabled={tickers.length >= MAX_TICKERS}
                  className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition disabled:bg-slate-50"
                  placeholder="e.g. TATASTEEL.NS"
                />
                <button
                  type="button"
                  onClick={addTicker}
                  disabled={tickers.length >= MAX_TICKERS || !tickerInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Add
                </button>
              </div>
              {tickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tickers.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTicker(t)}
                        className="h-4 w-4 inline-flex items-center justify-center rounded-full text-blue-400 hover:text-blue-700 hover:bg-blue-100"
                        aria-label={`Remove ${t}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">
                Add up to {MAX_TICKERS} NSE symbols (e.g. <span className="font-mono">INFY.NS</span>). Each is
                backtested with the same strategy so you can compare.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  {INTERVALS.map((iv) => <option key={iv} value={iv}>{iv}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </ConfigGroup>

          <ConfigGroup title="Risk / Reward">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">RR Ratio</label>
                <span className="text-sm font-bold text-blue-600 tabular-nums">{rr.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={5.0}
                step={0.5}
                value={rr}
                onChange={(e) => setRr(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 px-0.5">
                <span>1×</span><span>3×</span><span>5×</span>
              </div>
            </div>
          </ConfigGroup>

          <ConfigGroup title="Stop-Loss">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">SL Type</label>
              <select
                value={slType}
                onChange={(e) => setSlType(e.target.value as SlType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                <option value="SWING_LOW">
                  {direction === "SHORT" ? "Swing High" : "Swing Low"}
                </option>
                <option value="ATR_MULTIPLE">ATR Multiple</option>
                <option value="FIXED_PCT">Fixed Percentage</option>
                <option value="CHANDELIER_EXIT">Chandelier Exit (Trailing)</option>
              </select>
            </div>

            {slType === "SWING_LOW" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Lookback Candles</label>
                <input
                  type="number"
                  value={slLookback}
                  min={1}
                  onChange={(e) => setSlLookback(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
            {slType === "ATR_MULTIPLE" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">ATR Multiplier</label>
                <input
                  type="number"
                  value={atrMultiple}
                  step={0.1}
                  min={0.1}
                  onChange={(e) => setAtrMultiple(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
            {slType === "FIXED_PCT" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">SL Percentage</label>
                <input
                  type="number"
                  value={slPct}
                  step={0.1}
                  min={0.1}
                  onChange={(e) => setSlPct(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
            {slType === "CHANDELIER_EXIT" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">ATR Mult</label>
                    <input
                      type="number"
                      value={chandelierMultiple}
                      step={0.1}
                      min={0.5}
                      onChange={(e) => setChandelierMultiple(parseFloat(e.target.value) || 0.5)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">ATR Period</label>
                    <input
                      type="number"
                      value={chandelierPeriod}
                      min={2}
                      onChange={(e) => setChandelierPeriod(parseInt(e.target.value, 10) || 2)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5">
                  Trails highest high (or lowest low for shorts) since entry by N × ATR.
                </p>
              </>
            )}
          </ConfigGroup>

          <ConfigGroup title="Take-Profit">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                <option value="R_MULTIPLE">R-Multiple (uses RR above)</option>
                <option value="FIXED_PCT">Fixed Percentage</option>
                <option value="ATR_MULTIPLE">ATR Multiple</option>
                <option value="PRIOR_SWING_HIGH">
                  {direction === "SHORT" ? "Prior Swing Low" : "Prior Swing High"}
                </option>
              </select>
            </div>

            {targetType === "FIXED_PCT" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Target Percentage</label>
                <input
                  type="number"
                  value={targetPct}
                  step={0.1}
                  min={0.1}
                  onChange={(e) => setTargetPct(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
            {targetType === "ATR_MULTIPLE" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Target ATR Multiplier</label>
                <input
                  type="number"
                  value={targetAtrMultiple}
                  step={0.1}
                  min={0.1}
                  onChange={(e) => setTargetAtrMultiple(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
            {targetType === "PRIOR_SWING_HIGH" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Swing Lookback</label>
                <input
                  type="number"
                  value={targetSwingLookback}
                  min={2}
                  onChange={(e) => setTargetSwingLookback(parseInt(e.target.value, 10) || 2)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            )}
          </ConfigGroup>

          <ConfigGroup title="Time Exit" sub="Optional — close after N bars">
            <input
              type="number"
              value={maxBarsInTrade}
              min={1}
              placeholder="Leave blank to disable"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") { setMaxBarsInTrade(""); return }
                const parsed = parseInt(raw, 10)
                setMaxBarsInTrade(Number.isFinite(parsed) && parsed > 0 ? parsed : "")
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </ConfigGroup>

          <div className="flex flex-col gap-2 pt-5 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save Strategy"}
            </button>
            <button
              type="button"
              onClick={handleSaveAndRun}
              disabled={saving}
              className="group w-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>Working…</>
              ) : (
                <>
                  Save and Run
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
      </div>
    </div>
  )
}
