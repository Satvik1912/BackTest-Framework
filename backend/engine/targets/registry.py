import pandas as pd

from engine.targets.base import TargetCalculator

_DEFAULT_KEY = "R_MULTIPLE"


def get(key: str) -> TargetCalculator:
    cls = TargetCalculator._registry.get(key) or TargetCalculator._registry[_DEFAULT_KEY]
    return cls()


def compute(
    key: str,
    i: int,
    df: pd.DataFrame,
    entry: float,
    sl: float,
    strategy_def: dict,
) -> float:
    return get(key).compute(i, df, entry, sl, strategy_def)
