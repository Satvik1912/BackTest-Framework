import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getUserStrategies, runStrategyAsAdmin } from "../api/admin"
import { Strategy } from "../types"

export default function AdminUserStrategiesPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [runningId, setRunningId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    getUserStrategies(userId)
      .then(setStrategies)
      .catch((err) => setError(err.response?.data?.message || "Failed to load strategies"))
      .finally(() => setLoading(false))
  }, [userId])

  const handleRun = async (strategyId: string) => {
    setError("")
    setRunningId(strategyId)
    try {
      const job = await runStrategyAsAdmin(strategyId)
      navigate(`/admin/jobs/${job.jobId}`, { state: { fromUserId: userId } })
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start backtest")
      setRunningId(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500">Loading strategies...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
          ← Back to users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">User strategies</h1>
        <p className="text-gray-600 text-sm">All strategies created by this user.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {strategies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          This user has no strategies yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {strategies.map((s) => {
            const isDeleted = Boolean(s.deletedAt)
            return (
              <div
                key={s.id}
                className={`bg-white border rounded-xl p-5 flex flex-col ${
                  isDeleted ? "border-red-200 bg-red-50/40" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                    {isDeleted && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                        Deleted
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium whitespace-nowrap">
                    {s.ticker}
                  </span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-1">
                  <div><span className="text-gray-500">Interval:</span> {s.interval}</div>
                  <div><span className="text-gray-500">Period:</span> {s.period}</div>
                  <div><span className="text-gray-500">RR:</span> {s.rr}</div>
                  <div><span className="text-gray-500">Logic:</span> {s.conditionLogic}</div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Entry conditions: {s.entryConditions?.length ?? 0} ·
                  Exit conditions: {s.exitConditions?.length ?? 0}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Created {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                </div>
                {isDeleted && (
                  <div className="text-xs text-red-700 mt-0.5">
                    Deleted by user {s.deletedAt ? new Date(s.deletedAt).toLocaleString() : ""}
                  </div>
                )}
                <div className="mt-4 flex">
                  <button
                    type="button"
                    onClick={() => handleRun(s.id)}
                    disabled={runningId === s.id}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {runningId === s.id ? "Starting..." : "Run"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
