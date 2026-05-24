import pandas as pd

from engine.targets.base import TargetCalculator


class RMultipleTarget(TargetCalculator):
    key = "R_MULTIPLE"

    def compute(
        self,
        i: int,
        df: pd.DataFrame,
        entry: float,
        sl: float,
        strategy_def: dict,
    ) -> float:
        rr = float(strategy_def.get("rr", 2.0))
        return entry + rr * (entry - sl)
