import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class VwapIndicator(Indicator):
    key = "VWAP"
    display_name = "Volume Weighted Average Price"
    description = "Session-anchored VWAP; price above/below is the standard intraday bias."
    category = "VOLUME"
    params = [
        IndicatorParamSpec(
            "anchor", "Anchor", "ENUM", "SESSION",
            enumValues=["SESSION", "ROLLING"],
        ),
        IndicatorParamSpec("rollingPeriod", "Rolling period", "INT", 20, min=2, max=500),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        anchor = str(params.get("anchor", "SESSION"))
        period = int(params.get("rollingPeriod", 20))
        vwap = self._series(df, anchor, period)
        if i >= len(vwap) or pd.isna(vwap.iloc[i]):
            return False
        close = float(df.iloc[i]["close"])
        v_val = float(vwap.iloc[i])

        if operator == "OVER":
            return close > v_val
        if operator == "UNDER":
            return close < v_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1 and not pd.isna(vwap.iloc[i - 1]):
            prev_close = float(df.iloc[i - 1]["close"])
            prev_v = float(vwap.iloc[i - 1])
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, v_val, prev_close, prev_v)
            return crossed_below(close, v_val, prev_close, prev_v)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, anchor: str, period: int) -> pd.Series:
        if "volume" not in df.columns:
            return pd.Series([float("nan")] * len(df), index=df.index)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        volume = df["volume"].astype(float)
        typical = (high + low + close) / 3.0
        tpv = typical * volume

        if anchor == "ROLLING":
            num = tpv.rolling(period).sum()
            den = volume.rolling(period).sum().replace(0, pd.NA)
            return num / den

        if "datetime" in df.columns:
            session = pd.to_datetime(df["datetime"]).dt.date
            num = tpv.groupby(session).cumsum()
            den = volume.groupby(session).cumsum().replace(0, pd.NA)
            return num / den

        num = tpv.cumsum()
        den = volume.cumsum().replace(0, pd.NA)
        return num / den
