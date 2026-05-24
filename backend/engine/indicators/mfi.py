import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class MfiIndicator(Indicator):
    key = "MFI"
    display_name = "Money Flow Index"
    description = "Volume-weighted RSI (0-100); >80 overbought, <20 oversold."
    category = "VOLUME"
    params = [IndicatorParamSpec("period", "Period", "INT", 14, min=2, max=200)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 14))
        mfi = self._series(df, period)
        if i >= len(mfi) or pd.isna(mfi.iloc[i]):
            return False
        return apply_operator(float(mfi.iloc[i]), operator, threshold)

    @staticmethod
    def _series(df: pd.DataFrame, period: int) -> pd.Series:
        if "volume" not in df.columns:
            return pd.Series([float("nan")] * len(df), index=df.index)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        volume = df["volume"].astype(float)
        tp = (high + low + close) / 3.0
        mf = tp * volume
        delta = tp.diff()
        pos = mf.where(delta > 0, 0.0)
        neg = mf.where(delta < 0, 0.0)
        pos_sum = pos.rolling(period).sum()
        neg_sum = neg.rolling(period).sum()
        ratio = pos_sum / neg_sum.replace(0, pd.NA)
        return 100 - (100 / (1 + ratio))
