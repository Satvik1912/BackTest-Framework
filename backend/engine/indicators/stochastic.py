import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec, ThresholdSuggestion
from engine.operators import apply_operator, crossed_above, crossed_below


class StochasticIndicator(Indicator):
    key = "STOCHASTIC"
    display_name = "Stochastic Oscillator"
    description = "Momentum oscillator (0-100); %K above/below %D, or OB/OS at 80/20."
    category = "MOMENTUM"
    params = [
        IndicatorParamSpec("kPeriod", "%K period", "INT", 14, min=2, max=200),
        IndicatorParamSpec("dPeriod", "%D period", "INT", 3, min=1, max=50),
        IndicatorParamSpec("smooth", "%K smoothing", "INT", 3, min=1, max=50),
    ]

    uses_threshold = True
    threshold_label = "Stochastic level"
    threshold_help = (
        "Runs 0–100. 20 = oversold, 80 = overbought. Used with 'is above/below'. "
        "(The 'crosses' operators compare %K against %D and ignore this level.)"
    )
    threshold_min = 0
    threshold_max = 100
    default_threshold = 20
    threshold_suggestions = [
        ThresholdSuggestion("Oversold", 20),
        ThresholdSuggestion("Overbought", 80),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        k_p = int(params.get("kPeriod", 14))
        d_p = int(params.get("dPeriod", 3))
        smooth = int(params.get("smooth", 3))
        k, d = self._lines(df, k_p, d_p, smooth)
        if i >= len(k) or pd.isna(k.iloc[i]):
            return False
        k_val = float(k.iloc[i])

        if operator in ("OVER", "UNDER", "EQUALS"):
            return apply_operator(k_val, operator, threshold)
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1:
            d_val = d.iloc[i]
            prev_k = k.iloc[i - 1]
            prev_d = d.iloc[i - 1]
            if pd.isna(d_val) or pd.isna(prev_k) or pd.isna(prev_d):
                return False
            if operator == "CROSSES_ABOVE":
                return crossed_above(k_val, float(d_val), float(prev_k), float(prev_d))
            return crossed_below(k_val, float(d_val), float(prev_k), float(prev_d))
        return False

    @staticmethod
    def _lines(df: pd.DataFrame, k_p: int, d_p: int, smooth: int):
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        close = df["close"].astype(float)
        lowest = low.rolling(k_p).min()
        highest = high.rolling(k_p).max()
        raw_k = 100 * (close - lowest) / (highest - lowest).replace(0, pd.NA)
        k = raw_k.rolling(smooth).mean()
        d = k.rolling(d_p).mean()
        return k, d
