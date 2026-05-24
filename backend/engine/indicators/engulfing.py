from engine.indicators.base import Indicator


class EngulfingIndicator(Indicator):
    key = "ENGULFING"
    display_name = "Bullish Engulfing"
    description = "Two-candle reversal pattern where today's candle completely engulfs yesterday's."
    category = "PATTERN"
    params = []

    def evaluate(self, i, df, params, operator, threshold):
        if i < 2:
            return False
        prev = df.iloc[i - 1]
        prev2 = df.iloc[i - 2]
        prev_bearish = float(prev2["close"]) < float(prev2["open"])
        curr_bullish = float(prev["close"]) > float(prev["open"])
        engulfs = (
            float(prev["open"]) <= float(prev2["close"])
            and float(prev["close"]) >= float(prev2["open"])
        )
        return prev_bearish and curr_bullish and engulfs
