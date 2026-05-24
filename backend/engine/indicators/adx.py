import numpy as np
import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class AdxIndicator(Indicator):
    key = "ADX"
    display_name = "Average Directional Index"
    description = "Trend-strength oscillator (0-100); >25 typically signals a strong trend."
    category = "TREND"
    params = [IndicatorParamSpec("period", "Period", "INT", 14, min=2, max=200)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 14))
        adx = self._series(df, period)
        if i >= len(adx) or pd.isna(adx.iloc[i]):
            return False
        return apply_operator(float(adx.iloc[i]), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        prev_close = close.shift(1)

        up_move = high.diff()
        down_move = -low.diff()
        plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
        minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index)

        tr = pd.concat(
            [high - low, (high - prev_close).abs(), (low - prev_close).abs()],
            axis=1,
        ).max(axis=1)

        atr_s = tr.ewm(com=period - 1, min_periods=period).mean()
        plus_di = 100 * (plus_dm.ewm(com=period - 1, min_periods=period).mean() / atr_s.replace(0, np.nan))
        minus_di = 100 * (minus_dm.ewm(com=period - 1, min_periods=period).mean() / atr_s.replace(0, np.nan))
        dx = (100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan))
        return dx.ewm(com=period - 1, min_periods=period).mean()
