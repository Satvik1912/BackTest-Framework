import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class EmaIndicator(Indicator):
    key = "EMA"
    display_name = "Exponential Moving Average"
    description = "Trend-following average that weights recent prices more heavily."
    category = "TREND"
    params = [IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=500)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        ema = self._series(df, period)
        if i >= len(ema):
            return False
        ema_val = ema.iloc[i]
        if pd.isna(ema_val):
            return False
        close = float(df.iloc[i]["close"])

        if operator == "OVER":
            return close > ema_val
        if operator == "UNDER":
            return close < ema_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1:
            prev_close = float(df.iloc[i - 1]["close"])
            prev_ema = ema.iloc[i - 1]
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, ema_val, prev_close, prev_ema)
            return crossed_below(close, ema_val, prev_close, prev_ema)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        return df["close"].astype(float).ewm(span=period, adjust=False).mean()
