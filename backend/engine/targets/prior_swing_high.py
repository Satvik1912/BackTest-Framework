import pandas as pd

from engine.targets.base import TargetCalculator


class PriorSwingHighTarget(TargetCalculator):
    key = "PRIOR_SWING_HIGH"

    def compute(
        self,
        i: int,
        df: pd.DataFrame,
        entry: float,
        sl: float,
        strategy_def: dict,
    ) -> float:
        lookback = int(strategy_def.get("targetSwingLookback", 20))
        start = max(0, i - lookback)
        direction = strategy_def.get("direction", "LONG")
        if direction == "SHORT":
            swing_low = float(df.iloc[start:i]["low"].min()) if i > start else entry
            return min(swing_low, entry - (sl - entry))
        swing_high = float(df.iloc[start:i]["high"].max()) if i > start else entry
        return max(swing_high, entry + (entry - sl))
