import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { EquityPoint, JobResult, TradeRecord } from "../types"
import { INITIAL_CAPITAL, formatCurrency, formatDateTime } from "../lib/format"

const PAGE_SIZE = 20

function StatCard({
  label,
  value,
  hint,
  valueClass = "text-gray-900"
}: {
  label: string
  value: string
  hint?: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1 leading-snug">{hint}</div>}
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: EquityPoint }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-gray-600 mt-0.5">Equity: {formatCurrency(payload[0].value)}</div>
    </div>
  )
}

function profitFactorHint(pf: number): string {
  if (pf <= 0) return "No winning edge in this test"
  return `Made ₹${pf.toFixed(2)} for every ₹1 lost`
}

/** Renders one symbol's backtest result: stats, equity curve and trade log. */
export default function SymbolResult({ result }: { result: JobResult }) {
  const [page, setPage] = useState(1)

  const sortedTrades = useMemo<TradeRecord[]>(
    () => [...result.trades].sort((a, b) => a.entryTime.localeCompare(b.entryTime)),
    [result.trades]
  )

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedTrades = sortedTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const winRateClass = result.winRate > 50 ? "text-green-600" : "text-red-600"
  const sharpeClass = result.sharpeRatio > 1 ? "text-green-600" : "text-gray-700"

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Trades" value={String(result.totalTrades)} />
        <StatCard
          label="Win Rate"
          value={`${result.winRate}%`}
          valueClass={winRateClass}
          hint={`${result.wins} wins / ${result.losses} losses`}
        />
        <StatCard
          label="Profit Factor"
          value={String(result.profitFactor)}
          hint={profitFactorHint(result.profitFactor)}
        />
        <StatCard
          label="Max Drawdown"
          value={`${result.maxDrawdownPct}%`}
          valueClass="text-red-600"
          hint="Largest equity drop from a peak"
        />
        <StatCard
          label="Sharpe Ratio"
          value={String(result.sharpeRatio)}
          valueClass={sharpeClass}
          hint="Return vs. risk (higher is better)"
        />
        <StatCard label="Wins / Losses" value={`${result.wins} / ${result.losses}`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Equity Curve</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.equityCurve} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatCurrency(v)}
                domain={["auto", "auto"]}
                width={70}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={INITIAL_CAPITAL}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{ value: "Start", fill: "#6b7280", fontSize: 10, position: "insideTopRight" }}
              />
              <Line type="monotone" dataKey="equity" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Trade Log</h3>
          <span className="text-sm text-gray-500">{sortedTrades.length} trades</span>
        </div>

        {sortedTrades.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No trades were triggered for this symbol in the tested period.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Entry Time</th>
                    <th className="px-3 py-2">Exit Time</th>
                    <th className="px-3 py-2 text-right">Entry</th>
                    <th className="px-3 py-2 text-right">Exit</th>
                    <th className="px-3 py-2">Result</th>
                    <th className="px-3 py-2 text-right">PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTrades.map((t, idx) => {
                    const num = (safePage - 1) * PAGE_SIZE + idx + 1
                    const isWin = t.pnlPct >= 0
                    const pnlClass = isWin ? "text-green-600" : "text-red-600"
                    const pnlPrefix = isWin ? "+" : ""
                    const badgeClass = isWin ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    const badgeLabel = t.result === "TIME_EXIT" ? "TIME EXIT" : t.result
                    return (
                      <tr key={`${t.entryTime}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{num}</td>
                        <td className="px-3 py-2 text-gray-700">{formatDateTime(t.entryTime)}</td>
                        <td className="px-3 py-2 text-gray-700">{formatDateTime(t.exitTime)}</td>
                        <td className="px-3 py-2 text-right text-gray-900 font-mono">
                          {t.entryPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 font-mono">
                          {t.exitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${pnlClass}`}>
                          {pnlPrefix}
                          {t.pnlPct.toFixed(3)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
