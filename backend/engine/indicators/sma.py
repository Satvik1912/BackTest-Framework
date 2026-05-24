import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class SmaIndicator(Indicator):
    key = "SMA"
    display_name = "Simple Moving Average"
    description = "Smoothed average of closing prices over the lookback period."
    category = "TREND"
    params = [IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=500)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        sma = self._series(df, period)
        if i >= len(sma):
            return False
        sma_val = sma.iloc[i]
        if pd.isna(sma_val):
            return False
        close = float(df.iloc[i]["close"])

        if operator == "OVER":
            return close > sma_val
        if operator == "UNDER":
            return close < sma_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1:
            prev_close = float(df.iloc[i - 1]["close"])
            prev_sma = sma.iloc[i - 1]
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, sma_val, prev_close, prev_sma)
            return crossed_below(close, sma_val, prev_close, prev_sma)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        return df["close"].astype(float).rolling(window=period).mean()
