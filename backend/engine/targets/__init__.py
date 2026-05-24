"""Take-profit calculator package.

Mirrors engine/stoploss/: importing this package side-effect-imports every
concrete subclass so each registers itself via __init_subclass__ on the base.
"""
from engine.targets import (  # noqa: F401  -- side-effect imports register subclasses
    atr_multiple,
    fixed_pct,
    prior_swing_high,
    r_multiple,
)
from engine.targets.base import TargetCalculator
from engine.targets.registry import compute, get

__all__ = ["TargetCalculator", "compute", "get"]
