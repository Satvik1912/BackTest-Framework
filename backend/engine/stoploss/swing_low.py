import pandas as pd

from engine.stoploss.base import StoplossCalculator


class SwingLowStoploss(StoplossCalculator):
    key = "SWING_LOW"

    def compute(self, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
        lookback = int(strategy_def.get("slLookback", 5))
        start = max(0, i - lookback)
        direction = strategy_def.get("direction", "LONG")
        window = df.iloc[start:i] if i > start else df.iloc[i : i + 1]
        if direction == "SHORT":
            return float(window["high"].max())
        return float(window["low"].min())
