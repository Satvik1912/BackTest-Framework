import apiClient from "./client"
import { AdminUser, BacktestJob, EquityPoint, JobResult, Strategy, TradeRecord } from "../types"

export const listUsers = async (): Promise<AdminUser[]> => {
  const response = await apiClient.get<AdminUser[]>("/api/admin/users")
  return response.data
}

export const approveUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiClient.post<AdminUser>(
    `/api/admin/users/${userId}/approve`
  )
  return response.data
}

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${userId}`)
}

export const getUserStrategies = async (
  userId: string
): Promise<Strategy[]> => {
  const response = await apiClient.get<Strategy[]>(
    `/api/admin/users/${userId}/strategies`
  )
  return response.data
}

export const runStrategyAsAdmin = async (
  strategyId: string
): Promise<BacktestJob> => {
  const response = await apiClient.post<BacktestJob>(
    `/api/admin/strategies/${strategyId}/run`
  )
  return response.data
}

function parseIfString<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T
  }
  return value as T
}

function normalizeResult(raw: JobResult): JobResult {
  return {
    ...raw,
    equityCurve: parseIfString<EquityPoint[]>(raw.equityCurve),
    trades: parseIfString<TradeRecord[]>(raw.trades)
  }
}

function normalize(job: BacktestJob): BacktestJob {
  return {
    ...job,
    result: job.result ? normalizeResult(job.result) : job.result,
    results: job.results ? job.results.map(normalizeResult) : job.results
  }
}

export const getAdminJob = async (jobId: string): Promise<BacktestJob> => {
  const response = await apiClient.get<BacktestJob>(`/api/admin/jobs/${jobId}`)
  return normalize(response.data)
}
