import pandas as pd

from engine.targets.base import TargetCalculator


class FixedPctTarget(TargetCalculator):
    key = "FIXED_PCT"

    def compute(
        self,
        i: int,
        df: pd.DataFrame,
        entry: float,
        sl: float,
        strategy_def: dict,
    ) -> float:
        pct = float(strategy_def.get("targetPct", 3.0))
        direction = strategy_def.get("direction", "LONG")
        if direction == "SHORT":
            return entry * (1 - pct / 100)
        return entry * (1 + pct / 100)
