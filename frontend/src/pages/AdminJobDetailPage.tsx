import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { getAdminJob } from "../api/admin"
import { BacktestJob, JobResult } from "../types"
import { formatDateTime, formatElapsed } from "../lib/format"
import SymbolResult from "../components/SymbolResult"
import StrategySummary from "../components/StrategySummary"
import ResultsComparison from "../components/ResultsComparison"

const POLL_INTERVAL_MS = 2000
const ALL = "__ALL__"

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}

function resultsOf(job: BacktestJob): JobResult[] {
  if (job.results && job.results.length > 0) return job.results
  return job.result ? [job.result] : []
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
  const [now, setNow] = useState(() => Date.now())
  const [selectedSymbol, setSelectedSymbol] = useState<string>(ALL)

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

  const results = useMemo(() => (job ? resultsOf(job) : []), [job])
  const shown = useMemo(
    () => (selectedSymbol === ALL ? results : results.filter((r) => (r.symbol ?? "—") === selectedSymbol)),
    [results, selectedSymbol]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500">Loading job...</div>
    )
  }

  if (error && !job) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button type="button" onClick={() => navigate(backPath)} className="text-blue-600 hover:underline">
          {backLabel}
        </button>
      </div>
    )
  }

  if (!job) return null

  // Admins should see the applied strategy even while it's still running.
  const strategyPanel = <StrategySummary definition={job.definition} title="Strategy Applied" />

  if (job.status === "PENDING" || job.status === "RUNNING") {
    const submittedTs = new Date(job.submittedAt).getTime()
    const elapsedSec = Math.max(0, Math.floor((now - submittedTs) / 1000))
    const symbolLabel = job.tickers?.length ? job.tickers.join(", ") : job.ticker
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {job.status === "PENDING" ? "Queued" : "Running backtest"}
          </h1>
          <p className="text-gray-500 mb-1">
            {job.strategyName ?? "Strategy"} {symbolLabel ? `• ${symbolLabel}` : ""}
          </p>
          <p className="text-sm text-gray-400">Elapsed: {formatElapsed(elapsedSec)}</p>
        </div>
        {strategyPanel}
      </div>
    )
  }

  if (job.status === "FAILED") {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Backtest failed</h2>
          <p className="text-sm text-red-700 whitespace-pre-wrap">{job.errorMessage ?? "Unknown error"}</p>
        </div>
        {strategyPanel}
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

  const multi = results.length > 1

  return (
    <div>
      <div className="mb-6">
        <button type="button" onClick={() => navigate(backPath)} className="text-sm text-blue-600 hover:underline mb-2">
          {backLabel}
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          {job.strategyName ?? "Backtest result"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {results.length} {results.length === 1 ? "stock" : "stocks"} • Completed{" "}
          {formatDateTime(job.completedAt)}
        </p>
      </div>

      {job.errorMessage && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Note: {job.errorMessage}
        </div>
      )}

      <div className="mb-6">{strategyPanel}</div>

      {results.length === 0 ? (
        <p className="text-gray-500">Job is marked DONE but no result body was returned.</p>
      ) : (
        <>
          {multi && (
            <>
              <ResultsComparison results={results} selected={selectedSymbol} onSelect={setSelectedSymbol} />
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedSymbol(ALL)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                    selectedSymbol === ALL
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  All ({results.length})
                </button>
                {results.map((r) => {
                  const sym = r.symbol ?? "—"
                  return (
                    <button
                      type="button"
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold font-mono border transition ${
                        selectedSymbol === sym
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                      }`}
                    >
                      {sym}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="space-y-8">
            {shown.map((r) => (
              <section key={r.symbol ?? "single"}>
                {multi && (
                  <h2 className="text-lg font-bold text-gray-900 mb-3 font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {r.symbol ?? "—"}
                  </h2>
                )}
                <SymbolResult result={r} />
              </section>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="mt-8 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
      >
        {backLabel}
      </button>
    </div>
  )
}
