import pandas as pd

from engine.indicators import atr
from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class SupertrendIndicator(Indicator):
    key = "SUPERTREND"
    display_name = "Supertrend"
    description = "ATR-based trend follower; flips when price crosses the band."
    category = "TREND"
    params = [
        IndicatorParamSpec("period", "ATR period", "INT", 10, min=2, max=200),
        IndicatorParamSpec("multiplier", "Multiplier", "FLOAT", 3.0, min=0.5, max=10),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 10))
        multiplier = float(params.get("multiplier", 3.0))
        st = self._series(df, period, multiplier)
        if i >= len(st) or pd.isna(st.iloc[i]):
            return False
        close = float(df.iloc[i]["close"])
        st_val = float(st.iloc[i])

        if operator == "OVER":
            return close > st_val
        if operator == "UNDER":
            return close < st_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1 and not pd.isna(st.iloc[i - 1]):
            prev_close = float(df.iloc[i - 1]["close"])
            prev_st = float(st.iloc[i - 1])
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, st_val, prev_close, prev_st)
            return crossed_below(close, st_val, prev_close, prev_st)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, period: int, multiplier: float) -> pd.Series:
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        atr_series = atr.compute(df, period)
        hl2 = (high + low) / 2.0
        upper = hl2 + multiplier * atr_series
        lower = hl2 - multiplier * atr_series

        st = pd.Series(index=df.index, dtype=float)
        direction = pd.Series(index=df.index, dtype=int)
        for j in range(len(df)):
            if j == 0 or pd.isna(atr_series.iloc[j]):
                st.iloc[j] = float("nan")
                direction.iloc[j] = 1
                continue
            prev_st = st.iloc[j - 1]
            prev_dir = direction.iloc[j - 1]
            curr_upper = float(upper.iloc[j])
            curr_lower = float(lower.iloc[j])

            if pd.isna(prev_st):
                st.iloc[j] = curr_lower
                direction.iloc[j] = 1
                continue

            if prev_dir == 1:
                curr_lower = max(curr_lower, prev_st)
                if close.iloc[j] < curr_lower:
                    direction.iloc[j] = -1
                    st.iloc[j] = curr_upper
                else:
                    direction.iloc[j] = 1
                    st.iloc[j] = curr_lower
            else:
                curr_upper = min(curr_upper, prev_st)
                if close.iloc[j] > curr_upper:
                    direction.iloc[j] = 1
                    st.iloc[j] = curr_lower
                else:
                    direction.iloc[j] = -1
                    st.iloc[j] = curr_upper
        return st
