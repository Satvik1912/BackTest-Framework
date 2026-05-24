import numpy as np
import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class ObvIndicator(Indicator):
    key = "OBV"
    display_name = "On-Balance Volume"
    description = "Cumulative volume flow; compares OBV to its moving average for divergence/trend."
    category = "VOLUME"
    params = [IndicatorParamSpec("smaPeriod", "Signal SMA period", "INT", 20, min=2, max=500)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("smaPeriod", 20))
        obv, obv_sma = self._series(df, period)
        if i >= len(obv) or pd.isna(obv_sma.iloc[i]):
            return False
        obv_val = float(obv.iloc[i])
        sma_val = float(obv_sma.iloc[i])

        if operator == "OVER":
            return obv_val > sma_val
        if operator == "UNDER":
            return obv_val < sma_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1 and not pd.isna(obv_sma.iloc[i - 1]):
            prev_obv = float(obv.iloc[i - 1])
            prev_sma = float(obv_sma.iloc[i - 1])
            if operator == "CROSSES_ABOVE":
                return crossed_above(obv_val, sma_val, prev_obv, prev_sma)
            return crossed_below(obv_val, sma_val, prev_obv, prev_sma)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, period: int):
        close = df["close"].astype(float)
        if "volume" not in df.columns:
            zero = pd.Series([0.0] * len(df), index=df.index)
            return zero, zero
        volume = df["volume"].astype(float)
        direction = np.sign(close.diff().fillna(0))
        obv = (direction * volume).cumsum()
        return obv, obv.rolling(period).mean()
