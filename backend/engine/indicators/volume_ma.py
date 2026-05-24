import pandas as pd

from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.operators import apply_operator


class VolumeMaIndicator(Indicator):
    key = "VOLUME_MA"
    display_name = "Volume Moving Average"
    description = "Average traded volume — spikes above it confirm strong moves."
    category = "VOLUME"
    params = [IndicatorParamSpec("period", "Period", "INT", 20, min=2, max=200)]

    def evaluate(self, i, df, params, operator, threshold):
        period = int(params.get("period", 20))
        ma = df["volume"].astype(float).rolling(window=period).mean()
        if i >= len(ma):
            return False
        ma_val = ma.iloc[i]
        if pd.isna(ma_val):
            return False
        vol = float(df.iloc[i]["volume"])
        # Threshold is the moving-average value itself for VOLUME_MA.
        return apply_operator(vol, operator, float(ma_val))
