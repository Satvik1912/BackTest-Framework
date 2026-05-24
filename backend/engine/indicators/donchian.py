import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class DonchianIndicator(Indicator):
    key = "DONCHIAN"
    display_name = "Donchian Channel"
    description = "Rolling high/low channel; close breaking the upper band is the turtle entry."
    category = "VOLATILITY"
    params = [
        IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=500),
        IndicatorParamSpec(
            "band", "Band", "ENUM", "UPPER",
            enumValues=["UPPER", "LOWER", "MIDDLE"],
        ),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        band = str(params.get("band", "UPPER"))
        series = self._band_series(df, period, band)
        if i >= len(series) or pd.isna(series.iloc[i]):
            return False
        close = float(df.iloc[i]["close"])
        b_val = float(series.iloc[i])

        if operator == "OVER":
            return close > b_val
        if operator == "UNDER":
            return close < b_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1 and not pd.isna(series.iloc[i - 1]):
            prev_close = float(df.iloc[i - 1]["close"])
            prev_b = float(series.iloc[i - 1])
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, b_val, prev_close, prev_b)
            return crossed_below(close, b_val, prev_close, prev_b)
        return False

    @staticmethod
    def _band_series(df: pd.DataFrame, period: int, band: str) -> pd.Series:
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        upper = high.rolling(period).max()
        lower = low.rolling(period).min()
        if band == "UPPER":
            return upper
        if band == "LOWER":
            return lower
        return (upper + lower) / 2.0
