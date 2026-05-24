import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec


class BollingerIndicator(Indicator):
    key = "BOLLINGER"
    display_name = "Bollinger Bands"
    description = (
        "Volatility bands around a moving average; price touching the edges can hint "
        "at reversals."
    )
    category = "VOLATILITY"
    params = [
        IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=200),
        IndicatorParamSpec("multiplier", "Std-dev multiplier", "FLOAT", 2.0, min=0.5, max=5.0),
    ]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        multiplier = float(params.get("multiplier", 2.0))
        upper, _, lower = self._bands(df, period, multiplier)
        if i >= len(upper):
            return False
        upper_val, lower_val = upper.iloc[i], lower.iloc[i]
        if pd.isna(upper_val) or pd.isna(lower_val):
            return False
        close = float(df.iloc[i]["close"])

        if operator == "OVER":
            return close > upper_val
        if operator == "UNDER":
            return close < lower_val
        return False

    @staticmethod
    def _bands(df: pd.DataFrame, period: int, multiplier: float):
        close = df["close"].astype(float)
        sma = close.rolling(window=period).mean()
        std = close.rolling(window=period).std()
        return sma + (multiplier * std), sma, sma - (multiplier * std)
