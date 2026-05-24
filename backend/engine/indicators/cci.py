import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class CciIndicator(Indicator):
    key = "CCI"
    display_name = "Commodity Channel Index"
    description = "Measures deviation from average price; >100 strong up, <-100 strong down."
    category = "MOMENTUM"
    params = [IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=200)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        cci = self._series(df, period)
        if i >= len(cci) or pd.isna(cci.iloc[i]):
            return False
        return apply_operator(float(cci.iloc[i]), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        tp = (high + low + close) / 3.0
        sma = tp.rolling(period).mean()
        mad = tp.rolling(period).apply(lambda x: (x - x.mean()).abs().mean(), raw=False)
        return (tp - sma) / (0.015 * mad.replace(0, pd.NA))
