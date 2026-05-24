from typing import Optional

import pandas as pd

from engine.indicators import atr
from engine.stoploss.base import StoplossCalculator


class ChandelierExitStoploss(StoplossCalculator):
    """Chandelier Exit: trailing stop = highest-high-since-entry - multiplier * ATR.

    The initial stop is placed below entry using the same ATR offset, and is
    ratcheted upward each bar as new highs are made.
    """

    key = "CHANDELIER_EXIT"

    def compute(self, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
        multiple, period = self._params(strategy_def)
        atr_series = atr.compute(df, period)
        atr_val = atr_series.iloc[i]
        close = float(df.iloc[i]["close"])
        direction = strategy_def.get("direction", "LONG")
        if pd.isna(atr_val):
            return float(df.iloc[i]["high"] if direction == "SHORT" else df.iloc[i]["low"])
        if direction == "SHORT":
            return close + multiple * float(atr_val)
        return close - multiple * float(atr_val)

    def update(
        self,
        i: int,
        df: pd.DataFrame,
        trade: dict,
        strategy_def: dict,
    ) -> Optional[float]:
        multiple, period = self._params(strategy_def)
        atr_series = atr.compute(df, period)
        atr_val = atr_series.iloc[i]
        if pd.isna(atr_val):
            return None
        entry_idx = trade.get("entry_idx")
        if entry_idx is None or i <= entry_idx:
            return None
        direction = strategy_def.get("direction", "LONG")
        if direction == "SHORT":
            lowest = float(df.iloc[entry_idx : i + 1]["low"].min())
            return lowest + multiple * float(atr_val)
        highest = float(df.iloc[entry_idx : i + 1]["high"].max())
        return highest - multiple * float(atr_val)

    @staticmethod
    def _params(strategy_def: dict) -> tuple[float, int]:
        return (
            float(strategy_def.get("chandelierMultiple", 3.0)),
            int(strategy_def.get("chandelierPeriod", 22)),
        )
