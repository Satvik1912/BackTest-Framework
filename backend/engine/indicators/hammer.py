from engine.indicators.base import Indicator


class HammerIndicator(Indicator):
    key = "HAMMER"
    display_name = "Hammer"
    description = "Single-candle pattern that often marks the end of a downtrend."
    category = "PATTERN"
    params = []

    def evaluate(self, i, df, params, operator, threshold):
        # The pattern is read off the *previous* completed candle.
        if i < 1:
            return False
        candle = df.iloc[i - 1]
        body = abs(float(candle["close"]) - float(candle["open"]))
        if body == 0:
            return False
        upper = float(candle["high"]) - max(float(candle["close"]), float(candle["open"]))
        lower = min(float(candle["close"]), float(candle["open"])) - float(candle["low"])
        return lower >= 2 * body and upper <= body
