export type UserRole = "USER" | "ADMIN"

export interface User {
  userId: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  refreshToken: string
  email: string
  userId: string
  role: UserRole
}

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  isApproved: boolean
  createdAt: string
  lastLogin?: string
}

export interface ApiError {
  error: string
  message: string
}

export interface IndicatorParam {
  key: string
  label: string
  type: "INT" | "FLOAT" | "ENUM"
  defaultValue: number | string
  min?: number
  max?: number
  enumValues?: string[]
}

export interface IndicatorMetadata {
  key: string
  displayName: string
  description: string
  category: "TREND" | "MOMENTUM" | "VOLATILITY" | "PATTERN" | "VOLUME"
  executionSide: "JAVA" | "PYTHON"
  params: IndicatorParam[]
}

export interface IndicatorCondition {
  indicatorKey: string
  params: Record<string, number | string>
  operator: string
  threshold: number
}

export interface ExitCondition {
  type: string
  value: number
}

export type Direction = "LONG" | "SHORT"

export interface StrategyDefinition {
  name: string
  ticker: string
  interval: string
  period: string
  rr: number
  direction?: Direction
  slType: string
  slLookback?: number
  atrMultiple?: number
  slPct?: number
  chandelierMultiple?: number
  chandelierPeriod?: number
  targetType?: string
  targetPct?: number
  targetAtrMultiple?: number
  targetSwingLookback?: number
  maxBarsInTrade?: number
  conditionLogic: "AND" | "OR"
  entryConditions: IndicatorCondition[]
  exitConditions: ExitCondition[]
}

export interface Strategy {
  id: string
  name: string
  ticker: string
  interval: string
  period: string
  rr: number
  direction?: Direction
  slType?: string
  slLookback?: number
  atrMultiple?: number
  slPct?: number
  chandelierMultiple?: number
  chandelierPeriod?: number
  targetType?: string
  targetPct?: number
  targetAtrMultiple?: number
  targetSwingLookback?: number
  maxBarsInTrade?: number
  conditionLogic: string
  entryConditions: IndicatorCondition[]
  exitConditions: ExitCondition[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface TradeRecord {
  entryTime: string
  exitTime: string
  entryPrice: number
  exitPrice: number
  sl: number
  target: number
  direction?: Direction
  result: "TARGET" | "STOPLOSS" | "TIME_EXIT"
  pnlPct: number
}

export interface EquityPoint {
  date: string
  equity: number
}

export interface JobResult {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  maxDrawdownPct: number
  sharpeRatio: number
  equityCurve: EquityPoint[]
  trades: TradeRecord[]
}

export interface BacktestJob {
  jobId: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED"
  submittedAt: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  result?: JobResult
  strategyId?: string
  strategyName?: string
  ticker?: string
  interval?: string
  period?: string
  rr?: number
}
