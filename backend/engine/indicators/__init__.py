"""Indicator package.

Importing this package imports every concrete indicator module, which causes
each Indicator subclass to register itself via __init_subclass__ on the base.
The registry then exposes them by key.
"""
from engine.indicators import (  # noqa: F401  -- side-effect imports register subclasses
    adx,
    bollinger,
    cci,
    donchian,
    ema,
    engulfing,
    hammer,
    keltner,
    macd,
    mfi,
    obv,
    psar,
    roc,
    rsi,
    sma,
    stochastic,
    supertrend,
    volume_ma,
    vwap,
    williams_r,
)
from engine.indicators.base import Indicator, IndicatorParamSpec
from engine.indicators.registry import all_keys, get, metadata

__all__ = ["Indicator", "IndicatorParamSpec", "all_keys", "get", "metadata"]
