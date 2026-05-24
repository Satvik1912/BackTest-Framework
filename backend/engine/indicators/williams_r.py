import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class WilliamsRIndicator(Indicator):
    key = "WILLIAMS_R"
    display_name = "Williams %R"
    description = "Momentum oscillator (-100 to 0); below -80 oversold, above -20 overbought."
    category = "MOMENTUM"
    params = [IndicatorParamSpec("period", "Period", "INT", 14, min=2, max=200)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 14))
        wr = self._series(df, period)
        if i >= len(wr) or pd.isna(wr.iloc[i]):
            return False
        return apply_operator(float(wr.iloc[i]), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        highest = high.rolling(period).max()
        lowest = low.rolling(period).min()
        return -100 * (highest - close) / (highest - lowest).replace(0, pd.NA)
