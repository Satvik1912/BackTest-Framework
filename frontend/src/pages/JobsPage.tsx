import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { getJobs } from "../api/jobs"
import { BacktestJob } from "../types"

const POLL_INTERVAL_MS = 5000

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

function StatusBadge({ status }: { status: BacktestJob["status"] }) {
  if (status === "PENDING") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">PENDING</span>
  }
  if (status === "RUNNING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
        RUNNING
      </span>
    )
  }
  if (status === "DONE") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">DONE</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">FAILED</span>
}

export default function JobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<BacktestJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    let timeoutId: number | undefined

    const fetch = async () => {
      try {
        const data = await getJobs()
        if (!mounted) return
        setJobs(data)
        const hasActive = data.some(
          (j) => j.status === "PENDING" || j.status === "RUNNING"
        )
        if (hasActive) {
          timeoutId = window.setTimeout(fetch, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (mounted) setError(extractMessage(err, "Failed to load jobs"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500">
        Loading jobs...
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No jobs yet</h2>
        <p className="text-gray-500 mb-6">Run a backtest from a strategy to see results here.</p>
        <Link
          to="/dashboard/strategies/new"
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          New Strategy
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backtest Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} total</p>
        </div>
        <Link
          to="/dashboard/strategies/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          New Strategy
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Strategy</th>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job.jobId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {job.strategyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">{job.ticker ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{job.interval ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(job.submittedAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {job.completedAt ? formatDateTime(job.completedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {job.status === "DONE" && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/jobs/${job.jobId}`)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Results
                    </button>
                  )}
                  {job.status === "FAILED" && (
                    <span
                      className="text-sm text-red-600 cursor-help"
                      title={job.errorMessage ?? "Unknown error"}
                    >
                      Failed (hover)
                    </span>
                  )}
                  {(job.status === "PENDING" || job.status === "RUNNING") && (
                    <span className="text-sm text-gray-400">Processing...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
