export const INITIAL_CAPITAL = 100000

export function formatDateTime(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

// Plain-English labels for the raw operator enums so newcomers aren't faced
// with CROSSES_ABOVE etc.
export const OPERATOR_LABELS: Record<string, string> = {
  OVER: "is above",
  UNDER: "is below",
  EQUALS: "equals",
  CROSSES_ABOVE: "crosses above",
  CROSSES_BELOW: "crosses below"
}

export function operatorLabel(op: string): string {
  return OPERATOR_LABELS[op] ?? op
}
