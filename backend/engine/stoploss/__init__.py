"""Stoploss-calculator package.

Importing this package imports every concrete strategy module so subclasses
register themselves with the base via __init_subclass__.
"""
from engine.stoploss import (  # noqa: F401  -- side-effect imports register subclasses
    atr_multiple,
    chandelier,
    fixed_pct,
    swing_low,
)
from engine.stoploss.base import StoplossCalculator
from engine.stoploss.registry import compute, get

__all__ = ["StoplossCalculator", "compute", "get"]
