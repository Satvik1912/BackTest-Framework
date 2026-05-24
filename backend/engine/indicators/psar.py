import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class ParabolicSarIndicator(Indicator):
    key = "PSAR"
    display_name = "Parabolic SAR"
    description = "Trailing dots that flip when price reverses; classic trend-following stop."
    category = "TREND"
    params = [
        IndicatorParamSpec("step", "AF step", "FLOAT", 0.02, min=0.001, max=0.5),
        IndicatorParamSpec("maxAf", "AF max", "FLOAT", 0.2, min=0.01, max=1.0),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        step = float(params.get("step", 0.02))
        max_af = float(params.get("maxAf", 0.2))
        sar = self._series(df, step, max_af)
        if i >= len(sar) or pd.isna(sar.iloc[i]):
            return False
        close = float(df.iloc[i]["close"])
        s_val = float(sar.iloc[i])

        if operator == "OVER":
            return close > s_val
        if operator == "UNDER":
            return close < s_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1 and not pd.isna(sar.iloc[i - 1]):
            prev_close = float(df.iloc[i - 1]["close"])
            prev_s = float(sar.iloc[i - 1])
            if operator == "CROSSES_ABOVE":
                return crossed_above(close, s_val, prev_close, prev_s)
            return crossed_below(close, s_val, prev_close, prev_s)
        return False

    @staticmethod
    def _series(df: pd.DataFrame, step: float, max_af: float) -> pd.Series:
        high = df["high"].astype(float).values
        low = df["low"].astype(float).values
        n = len(df)
        sar = [float("nan")] * n
        if n < 2:
            return pd.Series(sar, index=df.index)

        long = True
        af = step
        ep = high[0]
        sar[0] = low[0]
        for j in range(1, n):
            prev_sar = sar[j - 1]
            new_sar = prev_sar + af * (ep - prev_sar)
            if long:
                new_sar = min(new_sar, low[j - 1], low[max(j - 2, 0)])
                if low[j] < new_sar:
                    long = False
                    new_sar = ep
                    ep = low[j]
                    af = step
                else:
                    if high[j] > ep:
                        ep = high[j]
                        af = min(af + step, max_af)
            else:
                new_sar = max(new_sar, high[j - 1], high[max(j - 2, 0)])
                if high[j] > new_sar:
                    long = True
                    new_sar = ep
                    ep = high[j]
                    af = step
                else:
                    if low[j] < ep:
                        ep = low[j]
                        af = min(af + step, max_af)
            sar[j] = new_sar
        return pd.Series(sar, index=df.index)
