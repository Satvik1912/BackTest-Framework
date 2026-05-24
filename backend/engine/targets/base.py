from __future__ import annotations

from abc import ABC, abstractmethod
from typing import ClassVar

import pandas as pd


class TargetCalculator(ABC):
    """Abstract base for any take-profit pricing strategy."""

    key: ClassVar[str]

    _registry: ClassVar[dict[str, type["TargetCalculator"]]] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if getattr(cls, "key", None):
            TargetCalculator._registry[cls.key] = cls

    @abstractmethod
    def compute(
        self,
        i: int,
        df: pd.DataFrame,
        entry: float,
        sl: float,
        strategy_def: dict,
    ) -> float:
        """Return the absolute take-profit price for entering at bar `i`."""
