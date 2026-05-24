import numpy as np
import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class RsiIndicator(Indicator):
    key = "RSI"
    display_name = "Relative Strength Index"
    description = "Momentum oscillator that flags overbought (>70) or oversold (<30) conditions."
    category = "MOMENTUM"
    params = [IndicatorParamSpec("period", "Period", "INT", 14, min=2, max=200)]

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
