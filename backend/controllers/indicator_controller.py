from fastapi import APIRouter

from dtos import IndicatorMetadata
from engine import INDICATORS

router = APIRouter(prefix="/api/indicators", tags=["indicators"])


@router.get("", response_model=list[IndicatorMetadata])
def list_indicators():
    return INDICATORS
