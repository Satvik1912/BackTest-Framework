import pandas as pd

from engine.stoploss.base import StoplossCalculator


class FixedPctStoploss(StoplossCalculator):
    key = "FIXED_PCT"

    def compute(self, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
        pct = float(strategy_def.get("slPct", 1.5))
        close = float(df.iloc[i]["close"])
        direction = strategy_def.get("direction", "LONG")
        if direction == "SHORT":
            return close * (1 + pct / 100)
        return close * (1 - pct / 100)
