import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { deleteStrategy, getStrategies, runBacktest } from "../api/strategies"
import { Strategy } from "../types"

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}

type Busy = { id: string; action: "run" | "delete" } | null

export default function StrategiesListPage() {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<Busy>(null)

  useEffect(() => {
    getStrategies()
      .then(setStrategies)
      .catch((err) => setError(extractMessage(err, "Failed to load strategies")))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = (strategy: Strategy) => {
    navigate("/dashboard/strategies/new", { state: { strategy } })
  }

  const handleRun = async (strategyId: string) => {
    setError("")
    setBusy({ id: strategyId, action: "run" })
    try {
      const job = await runBacktest(strategyId)
      navigate(`/dashboard/jobs/${job.jobId}`)
    } catch (err) {
      setError(extractMessage(err, "Failed to start backtest"))
      setBusy(null)
    }
  }

  const handleDelete = async (strategy: Strategy) => {
    const ok = window.confirm(
      `Delete strategy "${strategy.name}"?\n\nThis cannot be undone. Existing job results are kept.`
    )
    if (!ok) return
    setError("")
    setBusy({ id: strategy.id, action: "delete" })
    try {
      await deleteStrategy(strategy.id)
      setStrategies((prev) => prev.filter((s) => s.id !== strategy.id))
    } catch (err) {
      setError(extractMessage(err, "Failed to delete strategy"))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 text-sm">Loading strategies...</div>
      </div>
    )
  }

  if (!loading && strategies.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No strategies yet</h2>
        <p className="text-gray-500 mb-6">Build your first trading strategy to get started.</p>
        <Link
          to="/dashboard/strategies/new"
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          New Strategy
        </Link>
      </div>
    )
  }

  const isBusy = (id: string, action: "run" | "delete") =>
    busy?.id === id && busy.action === action

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strategies</h1>
          <p className="text-sm text-gray-500 mt-1">{strategies.length} saved</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
            <h3 className="font-semibold text-gray-900">{s.name}</h3>
            <div className="text-sm text-gray-500 mt-1">
              {s.ticker} <span className="text-gray-300">•</span> {s.interval} <span className="text-gray-300">•</span> {s.period}
            </div>
            <div className="text-xs text-gray-400 mt-3">
              {s.entryConditions.length} {s.entryConditions.length === 1 ? "condition" : "conditions"} ({s.conditionLogic})
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Created {new Date(s.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleEdit(s)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleRun(s.id)}
                disabled={isBusy(s.id, "run")}
                className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBusy(s.id, "run") ? "Starting..." : "Run"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s)}
                disabled={isBusy(s.id, "delete")}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBusy(s.id, "delete") ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
