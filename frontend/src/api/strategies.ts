import apiClient from "./client"
import {
  BacktestJob,
  IndicatorMetadata,
  Strategy,
  StrategyDefinition
} from "../types"

export const getIndicators = async (): Promise<IndicatorMetadata[]> => {
  const response = await apiClient.get<IndicatorMetadata[]>("/api/indicators")
  return response.data
}

export const createStrategy = async (
  definition: StrategyDefinition
): Promise<Strategy> => {
  const response = await apiClient.post<Strategy>("/api/strategies", definition)
  return response.data
}

export const getStrategies = async (): Promise<Strategy[]> => {
  const response = await apiClient.get<Strategy[]>("/api/strategies")
  return response.data
}

export const getStrategy = async (id: string): Promise<Strategy> => {
  const response = await apiClient.get<Strategy>(`/api/strategies/${id}`)
  return response.data
}

export const deleteStrategy = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/strategies/${id}`)
}

export const runBacktest = async (strategyId: string): Promise<BacktestJob> => {
  const response = await apiClient.post<BacktestJob>(
    "/api/backtest/run",
    { strategyId }
  )
  return response.data
}
