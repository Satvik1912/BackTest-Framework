import pandas as pd

from engine.indicators import atr
from engine.stoploss.base import StoplossCalculator


class AtrMultipleStoploss(StoplossCalculator):
    key = "ATR_MULTIPLE"

    def compute(self, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
        multiple = float(strategy_def.get("atrMultiple", 1.5))
        atr_series = atr.compute(df, 14)
        atr_val = atr_series.iloc[i]
        close = float(df.iloc[i]["close"])
        direction = strategy_def.get("direction", "LONG")
        if pd.isna(atr_val):
            return float(df.iloc[i]["high"] if direction == "SHORT" else df.iloc[i]["low"])
        if direction == "SHORT":
            return close + (multiple * float(atr_val))
        return close - (multiple * float(atr_val))
