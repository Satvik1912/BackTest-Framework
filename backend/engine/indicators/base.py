"""Indicator abstraction.

Each indicator is a class that:
  - declares static metadata (key, display_name, description, category, params)
  - implements evaluate(...) -> bool

Subclasses are auto-registered via __init_subclass__, so adding a new indicator
means dropping a new module under engine/indicators/. No registry edits, no
giant if/elif chain anywhere in the codebase.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, ClassVar, Optional

import pandas as pd


@dataclass(frozen=True)
class IndicatorParamSpec:
    key: str
    label: str
    type: str
    defaultValue: Any
    min: Optional[float] = None
    max: Optional[float] = None
    enumValues: Optional[list[str]] = None
    help: str = ""


@dataclass(frozen=True)
class ThresholdSuggestion:
    """A labelled quick-pick value shown next to the threshold input.

    e.g. RSI → ThresholdSuggestion("Oversold", 30) so a newcomer can click
    "Oversold" instead of guessing a number.
    """
    label: str
    value: float


class Indicator(ABC):
    """Abstract base for any condition that can be checked at a given bar."""

    # Static metadata — required on every concrete subclass.
    key: ClassVar[str]
    display_name: ClassVar[str]
    description: ClassVar[str]
    category: ClassVar[str]  # MOMENTUM | TREND | VOLATILITY | PATTERN | VOLUME
    params: ClassVar[list[IndicatorParamSpec]] = []

    # --- Threshold guidance (drives the "what do I type here?" UX) ---
    # Default False: most indicators are signal/price based (e.g. an EMA cross
    # or MACD vs its signal line) and compute their own comparison, so the
    # user-entered threshold is meaningless and the UI hides the box. Only
    # oscillators that literally compare their value to a user level opt in.
    uses_threshold: ClassVar[bool] = False
    threshold_label: ClassVar[str] = "Threshold"
    threshold_help: ClassVar[str] = ""
    threshold_min: ClassVar[Optional[float]] = None
    threshold_max: ClassVar[Optional[float]] = None
    default_threshold: ClassVar[float] = 0.0
    threshold_suggestions: ClassVar[list[ThresholdSuggestion]] = []

    # Populated by __init_subclass__
    _registry: ClassVar[dict[str, type["Indicator"]]] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if getattr(cls, "key", None):
            Indicator._registry[cls.key] = cls

    @abstractmethod
    def evaluate(
        self,
        i: int,
        df: pd.DataFrame,
        params: dict,
        operator: str,
        threshold: float,
    ) -> bool:
        """Return True if this indicator's condition is satisfied at bar `i`."""
