from __future__ import annotations

from abc import ABC, abstractmethod
from typing import ClassVar, Optional

import pandas as pd


class StoplossCalculator(ABC):
    """Abstract base for any stoploss-pricing strategy."""

    key: ClassVar[str]

    _registry: ClassVar[dict[str, type["StoplossCalculator"]]] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if getattr(cls, "key", None):
            StoplossCalculator._registry[cls.key] = cls

    @abstractmethod
    def compute(self, i: int, df: pd.DataFrame, strategy_def: dict) -> float:
        """Return the absolute stoploss price for entering at bar `i`."""

    def update(
        self,
        i: int,
        df: pd.DataFrame,
        trade: dict,
        strategy_def: dict,
    ) -> Optional[float]:
        """Return a new stoploss price for an open trade at bar `i`, or None to keep current.

        Default is a no-op (fixed stop). Trailing stops override this.
        """
        return None
