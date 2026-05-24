"""Trade-statistics aggregation (win rate, profit factor, drawdown, Sharpe, equity curve)."""
from typing import Iterable

import numpy as np

INITIAL_CAPITAL = 100_000
TRADING_DAYS = 252


def compute(trades: list[dict], rr: float, initial_capital: float = INITIAL_CAPITAL) -> dict:
    if not trades:
        return _empty()

    enriched, returns = _walk(trades, rr, initial_capital)
    wins = sum(1 for r in returns if r > 0)
    losses = sum(1 for r in returns if r < 0)

    return {
        "totalTrades": len(trades),
        "wins": wins,
        "losses": losses,
        "winRate": round(wins / len(trades) * 100, 2),
        "profitFactor": _profit_factor(returns),
        "maxDrawdownPct": round(_max_drawdown(returns, initial_capital), 3),
        "sharpeRatio": _sharpe(returns),
        "equityCurve": [
            {"date": t["exitTime"][:10] if t.get("exitTime") else "", "equity": e}
            for t, e in zip(enriched, _running_equity(returns, initial_capital))
        ],
        "trades": enriched,
    }


# ---------- private helpers ----------

def _walk(trades: list[dict], rr: float, initial_capital: float) -> tuple[list[dict], list[float]]:
    enriched: list[dict] = []
    returns: list[float] = []
    for t in trades:
        entry, sl, exit_price = t["entry_price"], t["sl"], t["exit_price"]
        direction = t.get("direction", "LONG")
        raw_pct = (exit_price - entry) / entry * 100
        pnl_pct = -raw_pct if direction == "SHORT" else raw_pct
        returns.append(pnl_pct)
        enriched.append({
            "entryTime": t.get("entry_time", ""),
            "exitTime": t.get("exit_time", ""),
            "entryPrice": round(entry, 2),
            "exitPrice": round(exit_price, 2),
            "sl": round(sl, 2),
            "target": round(t["target"], 2),
            "direction": direction,
            "result": t["result"],
            "pnlPct": round(pnl_pct, 3),
        })
    return enriched, returns


def _running_equity(returns: Iterable[float], initial_capital: float) -> list[float]:
    equity = initial_capital
    out: list[float] = []
    for r in returns:
        equity += equity * (r / 100)
        out.append(round(equity, 2))
    return out


def _profit_factor(returns: list[float]) -> float:
    gross_profit = sum(r for r in returns if r > 0)
    gross_loss = abs(sum(r for r in returns if r < 0))
    return round(gross_profit / gross_loss, 4) if gross_loss > 0 else 0.0


def _max_drawdown(returns: list[float], initial_capital: float) -> float:
    peak = initial_capital
    equity = initial_capital
    max_dd = 0.0
    for r in returns:
        equity += equity * (r / 100)
        peak = max(peak, equity)
        max_dd = max(max_dd, (peak - equity) / peak * 100)
    return max_dd


def _sharpe(returns: list[float]) -> float:
    arr = np.array(returns)
    if len(arr) <= 1 or arr.std() == 0:
        return 0.0
    return round(float(arr.mean() / arr.std() * np.sqrt(TRADING_DAYS)), 3)


def _empty() -> dict:
    return {
        "totalTrades": 0, "wins": 0, "losses": 0,
        "winRate": 0.0, "profitFactor": 0.0, "maxDrawdownPct": 0.0,
        "sharpeRatio": 0.0, "equityCurve": [], "trades": [],
    }
