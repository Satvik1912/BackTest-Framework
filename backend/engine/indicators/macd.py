import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import crossed_above, crossed_below


class MacdIndicator(Indicator):
    key = "MACD"
    display_name = "MACD"
    description = (
        "Compares two EMAs to flag momentum changes; cross of MACD over signal line "
        "is the classic signal."
    )
    category = "MOMENTUM"
    params = [
        IndicatorParamSpec("shortPeriod", "Short period", "INT", 12, min=2, max=100),
        IndicatorParamSpec("longPeriod", "Long period", "INT", 26, min=2, max=200),
        IndicatorParamSpec("signalPeriod", "Signal period", "INT", 9, min=2, max=100),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        short = int(params.get("shortPeriod", 12))
        long_p = int(params.get("longPeriod", 26))
        signal_p = int(params.get("signalPeriod", 9))

        macd, signal = self._lines(df, short, long_p, signal_p)
        if i >= len(macd):
            return False
        macd_val, sig_val = macd.iloc[i], signal.iloc[i]
        if pd.isna(macd_val) or pd.isna(sig_val):
            return False

        if operator == "OVER":
            return macd_val > sig_val
        if operator == "UNDER":
            return macd_val < sig_val
        if operator in ("CROSSES_ABOVE", "CROSSES_BELOW") and i >= 1:
            prev_macd, prev_sig = macd.iloc[i - 1], signal.iloc[i - 1]
            if operator == "CROSSES_ABOVE":
                return crossed_above(macd_val, sig_val, prev_macd, prev_sig)
            return crossed_below(macd_val, sig_val, prev_macd, prev_sig)
        return False

    @staticmethod
    def _lines(df: pd.DataFrame, short: int, long_p: int, signal_p: int):
        close = df["close"].astype(float)
        ema_short = close.ewm(span=short, adjust=False).mean()
        ema_long = close.ewm(span=long_p, adjust=False).mean()
        macd = ema_short - ema_long
        signal = macd.ewm(span=signal_p, adjust=False).mean()
        return macd, signal
