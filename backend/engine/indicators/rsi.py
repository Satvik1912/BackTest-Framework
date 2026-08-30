import numpy as np
import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec, ThresholdSuggestion
from engine.operators import apply_operator


class RsiIndicator(Indicator):
    key = "RSI"
    display_name = "Relative Strength Index"
    description = "Momentum oscillator that flags overbought (>70) or oversold (<30) conditions."
    category = "MOMENTUM"
    params = [
        IndicatorParamSpec(
            "period", "Period", "INT", 14, min=2, max=200,
            help="How many candles to average. 14 is the standard; lower = more sensitive.",
        )
    ]

    uses_threshold = True
    threshold_label = "RSI level"
    threshold_help = (
        "RSI runs 0–100. Common levels: 30 = oversold (price may bounce up), "
        "70 = overbought (price may pull back). Pick the level to compare against."
    )
    threshold_min = 0
    threshold_max = 100
    default_threshold = 30
    threshold_suggestions = [
        ThresholdSuggestion("Oversold", 30),
        ThresholdSuggestion("Midline", 50),
        ThresholdSuggestion("Overbought", 70),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 14))
        rsi = self._series(df, period)
        if i >= len(rsi):
            return False
        val = rsi.iloc[i]
        if pd.isna(val):
            return False
        return apply_operator(float(val), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        close = df["close"].astype(float)
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        return 100 - (100 / (1 + rs))
