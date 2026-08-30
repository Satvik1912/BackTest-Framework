from typing import Any, Optional

from pydantic import BaseModel


class IndicatorParam(BaseModel):
    key: str
    label: str
    type: str
    defaultValue: Any
    min: Optional[float] = None
    max: Optional[float] = None
    enumValues: Optional[list[str]] = None
    help: str = ""


class ThresholdSuggestionDTO(BaseModel):
    label: str
    value: float


class IndicatorMetadata(BaseModel):
    key: str
    displayName: str
    description: str
    category: str
    executionSide: str
    params: list[IndicatorParam] = []
    # Threshold guidance — lets the frontend explain the "Threshold" box (or
    # hide it entirely when the indicator computes its own comparison).
    usesThreshold: bool = False
    thresholdLabel: str = "Threshold"
    thresholdHelp: str = ""
    thresholdMin: Optional[float] = None
    thresholdMax: Optional[float] = None
    defaultThreshold: float = 0.0
    thresholdSuggestions: list[ThresholdSuggestionDTO] = []
