import { useEffect, useState } from "react"
import { getIndicators } from "../api/strategies"
import { IndicatorMetadata, StrategyDefinitionView } from "../types"
import { operatorLabel } from "../lib/format"

function slDescription(d: StrategyDefinitionView): string {
  switch (d.slType) {
    case "SWING_LOW":
      return `Swing low/high over ${d.slLookback ?? 5} candles`
    case "ATR_MULTIPLE":
      return `${d.atrMultiple ?? 1.5}× ATR(14) from entry`
    case "FIXED_PCT":
      return `${d.slPct ?? 1.5}% from entry`
    case "CHANDELIER_EXIT":
      return `Chandelier trail: ${d.chandelierMultiple ?? 3}× ATR(${d.chandelierPeriod ?? 22})`
    default:
      return d.slType ?? "—"
  }
}

function targetDescription(d: StrategyDefinitionView): string {
  switch (d.targetType) {
    case "R_MULTIPLE":
      return `${d.rr ?? 2}× risk (reward:risk)`
    case "FIXED_PCT":
      return `${d.targetPct ?? 3}% from entry`
    case "ATR_MULTIPLE":
      return `${d.targetAtrMultiple ?? 2}× ATR(14) from entry`
    case "PRIOR_SWING_HIGH":
      return `Prior swing high/low over ${d.targetSwingLookback ?? 20} candles`
    default:
      return d.targetType ?? "—"
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2 border-b border-gray-100 last:border-b-0">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-32 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  )
}

/**
 * Human-readable recap of the strategy that was applied. Fetches indicator
 * metadata so it can show display names and drop meaningless thresholds
 * (e.g. MACD crossovers) from the sentence.
 */
export default function StrategySummary({
  definition,
  title = "Strategy Applied"
}: {
  definition?: StrategyDefinitionView
  title?: string
}) {
  const [indicators, setIndicators] = useState<Record<string, IndicatorMetadata>>({})

  useEffect(() => {
    let mounted = true
    getIndicators()
      .then((list) => {
        if (!mounted) return
        const map: Record<string, IndicatorMetadata> = {}
        list.forEach((m) => (map[m.key] = m))
        setIndicators(map)
      })
      .catch(() => {
        /* fall back to raw keys */
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!definition) return null

  const logic = definition.conditionLogic === "OR" ? "OR" : "AND"
  const conditions = definition.entryConditions ?? []
  const direction = definition.direction === "SHORT" ? "SHORT" : "LONG"

  const describeCondition = (
    cond: NonNullable<StrategyDefinitionView["entryConditions"]>[number]
  ): string => {
    const meta = indicators[cond.indicatorKey]
    const name = meta?.displayName ?? cond.indicatorKey
    const period = cond.params?.period
    const nameWithPeriod = period != null ? `${name}(${period})` : name
    const op = operatorLabel(cond.operator)
    const isPattern = meta?.category === "PATTERN"
    const usesThreshold = meta ? meta.usesThreshold : true
    if (isPattern) return `${nameWithPeriod} pattern appears`
    if (!usesThreshold) return `${nameWithPeriod} ${op} its signal`
    return `${nameWithPeriod} ${op} ${cond.threshold}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>

      <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 leading-relaxed">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
            direction === "LONG" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}
        >
          {direction === "LONG" ? "↑ LONG" : "↓ SHORT"}
        </span>
        Enter when{" "}
        {conditions.length === 0 ? (
          <span className="italic text-slate-400">no conditions</span>
        ) : (
          conditions.map((c, i) => (
            <span key={i}>
              <span className="font-medium text-slate-900">{describeCondition(c)}</span>
              {i < conditions.length - 1 && (
                <span className="mx-1 text-slate-400 font-semibold">{logic}</span>
              )}
            </span>
          ))
        )}
        .
      </div>

      <dl>
        <Row label="Direction">{direction}</Row>
        <Row label="Combine">{logic === "AND" ? "All conditions (AND)" : "Any condition (OR)"}</Row>
        <Row label="Stop-Loss">{slDescription(definition)}</Row>
        <Row label="Take-Profit">{targetDescription(definition)}</Row>
        {definition.maxBarsInTrade ? (
          <Row label="Time Exit">Close after {definition.maxBarsInTrade} candles</Row>
        ) : null}
      </dl>
    </div>
  )
}
