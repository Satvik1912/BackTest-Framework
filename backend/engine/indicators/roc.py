import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec, ThresholdSuggestion
from engine.operators import apply_operator


class RocIndicator(Indicator):
    key = "ROC"
    display_name = "Rate of Change"
    description = "Percent change in close price over the lookback period."
    category = "MOMENTUM"
    params = [IndicatorParamSpec("period", "Period", "INT", 12, min=1, max=200)]

    uses_threshold = True
    threshold_label = "ROC %"
    threshold_help = (
        "Percent price change over the period. 0 = flat. Positive = rising "
        "momentum, negative = falling. Try 'is above 0' to catch upturns."
    )
    threshold_min = -100
    threshold_max = 100
    default_threshold = 0
    threshold_suggestions = [
        ThresholdSuggestion("Falling", -5),
        ThresholdSuggestion("Flat", 0),
        ThresholdSuggestion("Rising", 5),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 12))
        roc = self._series(df, period)
        if i >= len(roc) or pd.isna(roc.iloc[i]):
            return False
        return apply_operator(float(roc.iloc[i]), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        close = df["close"].astype(float)
        return 100 * (close - close.shift(period)) / close.shift(period).replace(0, pd.NA)
