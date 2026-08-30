"""Cross-cutting domain constants (imported by both engine and services)."""

# Max number of stocks a single strategy/backtest can analyze at once.
# Kept small because yfinance fetches are sequential + rate-limited and each
# symbol runs a full backtest; 5 keeps a job bounded on the free tier.
MAX_TICKERS = 5
