import pandas as pd

from engine.stoploss.base import StoplossCalculator

_DEFAULT_KEY = "SWING_LOW"


def get(key: str) -> StoplossCalculator:
    cls = StoplossCalculator._registry.get(key) or StoplossCalculator._registry[_DEFAULT_KEY]
    return cls()


def compute(key: str, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
    return get(key).compute(i, df, strategy_def)
