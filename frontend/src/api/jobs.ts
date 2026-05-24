import apiClient from "./client"
import { BacktestJob, EquityPoint, JobResult, TradeRecord } from "../types"

function parseIfString<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T
  }
  return value as T
}

function normalize(job: BacktestJob): BacktestJob {
  if (!job.result) return job
  const raw = job.result as JobResult
  return {
    ...job,
    result: {
      ...raw,
      equityCurve: parseIfString<EquityPoint[]>(raw.equityCurve),
      trades: parseIfString<TradeRecord[]>(raw.trades)
    }
  }
}

export const getJobs = async (): Promise<BacktestJob[]> => {
  const response = await apiClient.get<BacktestJob[]>("/api/backtest/jobs")
  return response.data.map(normalize)
}

export const getJob = async (jobId: string): Promise<BacktestJob> => {
  const response = await apiClient.get<BacktestJob>(`/api/backtest/jobs/${jobId}`)
  return normalize(response.data)
}
