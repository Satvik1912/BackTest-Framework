import pandas as pd

from engine.indicators import atr
from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class KeltnerIndicator(Indicator):
    key = "KELTNER"
    display_name = "Keltner Channel"
    description = "EMA-centered band offset by ATR; price riding the upper band signals trend."
    category = "VOLATILITY"
    params = [
        IndicatorParamSpec("emaPeriod", "EMA period", "INT", 20, min=2, max=500),
        IndicatorParamSpec("atrPeriod", "ATR period", "INT", 10, min=2, max=200),
        IndicatorParamSpec("multiplier", "ATR multiplier", "FLOAT", 2.0, min=0.5, max=10),
        IndicatorParamSpec(
            "band", "Band", "ENUM", "UPPER",
            enumValues=["UPPER", "LOWER", "MIDDLE"],
        ),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        ema_p = int(params.get("emaPeriod", 20))
        atr_p = int(params.get("atrPeriod", 10))
        mult = float(params.get("multiplier", 2.0))
        band = str(params.get("band", "UPPER"))
        series = self._band(df, ema_p, atr_p, mult, band)
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
    def _band(df: pd.DataFrame, ema_p: int, atr_p: int, mult: float, band: str) -> pd.Series:
        close = df["close"].astype(float)
        ema = close.ewm(span=ema_p, adjust=False).mean()
        atr_s = atr.compute(df, atr_p)
        if band == "UPPER":
            return ema + mult * atr_s
        if band == "LOWER":
            return ema - mult * atr_s
        return ema
