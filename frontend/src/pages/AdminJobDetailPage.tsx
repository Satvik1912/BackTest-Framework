import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import axios from "axios"
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
import { getAdminJob } from "../api/admin"
import { BacktestJob, EquityPoint, JobResult, TradeRecord } from "../types"

const POLL_INTERVAL_MS = 2000
const INITIAL_CAPITAL = 100000
const PAGE_SIZE = 20

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function StatCard({
  label,
  value,
  valueClass = "text-gray-900"
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</div>
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

export default function AdminJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backUserId = (location.state as { fromUserId?: string } | null)?.fromUserId
  const backPath = backUserId ? `/admin/users/${backUserId}/strategies` : "/admin/users"
  const backLabel = backUserId ? "← Back to strategies" : "← Back to users"

  const [job, setJob] = useState<BacktestJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!jobId) return
    let mounted = true
    let timeoutId: number | undefined

    const fetch = async () => {
      try {
        const data = await getAdminJob(jobId)
        if (!mounted) return
        setJob(data)
        if (data.status === "PENDING" || data.status === "RUNNING") {
          timeoutId = window.setTimeout(fetch, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (mounted) setError(extractMessage(err, "Failed to load job"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [jobId])

  useEffect(() => {
    if (!job) return
    if (job.status !== "PENDING" && job.status !== "RUNNING") return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [job?.status, job])

  const sortedTrades = useMemo<TradeRecord[]>(() => {
    if (!job?.result) return []
    return [...job.result.trades].sort((a, b) =>
      a.entryTime.localeCompare(b.entryTime)
    )
  }, [job?.result])

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedTrades = sortedTrades.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500">
        Loading job...
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-blue-600 hover:underline"
        >
          {backLabel}
        </button>
      </div>
    )
  }

  if (!job) return null

  if (job.status === "PENDING" || job.status === "RUNNING") {
    const submittedTs = new Date(job.submittedAt).getTime()
    const elapsedSec = Math.max(0, Math.floor((now - submittedTs) / 1000))
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {job.status === "PENDING" ? "Queued" : "Running backtest"}
        </h1>
        <p className="text-gray-500 mb-1">
          {job.strategyName ?? "Strategy"} {job.ticker ? `• ${job.ticker}` : ""}
        </p>
        <p className="text-sm text-gray-400">
          Elapsed: {formatElapsed(elapsedSec)}
        </p>
      </div>
    )
  }

  if (job.status === "FAILED") {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Backtest failed</h2>
          <p className="text-sm text-red-700 whitespace-pre-wrap">
            {job.errorMessage ?? "Unknown error"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          {backLabel}
        </button>
      </div>
    )
  }

  const result: JobResult | undefined = job.result
  if (!result) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-gray-500 mb-4">Job is marked DONE but no result body was returned.</p>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-blue-600 hover:underline"
        >
          {backLabel}
        </button>
      </div>
    )
  }

  const winRateClass = result.winRate > 50 ? "text-green-600" : "text-red-600"
  const sharpeClass = result.sharpeRatio > 1 ? "text-green-600" : "text-gray-700"

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-sm text-blue-600 hover:underline mb-2"
        >
          {backLabel}
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          {job.strategyName ?? "Backtest result"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Completed {formatDateTime(job.completedAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total Trades" value={String(result.totalTrades)} />
        <StatCard label="Win Rate" value={`${result.winRate}%`} valueClass={winRateClass} />
        <StatCard label="Profit Factor" value={String(result.profitFactor)} />
        <StatCard label="Max Drawdown" value={`${result.maxDrawdownPct}%`} valueClass="text-red-600" />
        <StatCard label="Sharpe Ratio" value={String(result.sharpeRatio)} valueClass={sharpeClass} />
        <StatCard label="Wins / Losses" value={`${result.wins} / ${result.losses}`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Equity Curve</h2>
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
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Trade Log</h2>
          <span className="text-sm text-gray-500">{sortedTrades.length} trades</span>
        </div>

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
                const badgeClass = isWin
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
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
                      {pnlPrefix}{t.pnlPct.toFixed(3)}%
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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Strategy Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticker</dt>
            <dd className="text-sm text-gray-900 mt-1">{job.ticker ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interval</dt>
            <dd className="text-sm text-gray-900 mt-1">{job.interval ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Period</dt>
            <dd className="text-sm text-gray-900 mt-1">{job.period ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">RR Ratio</dt>
            <dd className="text-sm text-gray-900 mt-1">{job.rr ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
