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


class IndicatorMetadata(BaseModel):
    key: str
    displayName: str
    description: str
    category: str
    executionSide: str
    params: list[IndicatorParam] = []
