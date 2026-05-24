import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class RocIndicator(Indicator):
    key = "ROC"
    display_name = "Rate of Change"
    description = "Percent change in close price over the lookback period."
    category = "MOMENTUM"
    params = [IndicatorParamSpec("period", "Period", "INT", 12, min=1, max=200)]

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
