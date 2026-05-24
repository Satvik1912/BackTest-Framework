import pandas as pd

from engine.indicators import atr
from engine.targets.base import TargetCalculator


class AtrMultipleTarget(TargetCalculator):
    key = "ATR_MULTIPLE"

    def compute(
        self,
        i: int,
        df: pd.DataFrame,
        entry: float,
        sl: float,
        strategy_def: dict,
    ) -> float:
        multiple = float(strategy_def.get("targetAtrMultiple", 2.0))
        atr_series = atr.compute(df, 14)
        atr_val = atr_series.iloc[i]
        direction = strategy_def.get("direction", "LONG")
        if pd.isna(atr_val):
            return entry + (entry - sl) * 2
        if direction == "SHORT":
            return entry - multiple * float(atr_val)
        return entry + multiple * float(atr_val)
