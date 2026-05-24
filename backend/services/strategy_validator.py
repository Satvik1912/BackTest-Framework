from fastapi import HTTPException

from dtos import StrategyDefinitionDTO
from engine import valid_keys


def validate(dto: StrategyDefinitionDTO) -> None:
    keys = valid_keys()
    for cond in dto.entryConditions:
        if cond.indicatorKey not in keys:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown indicator key: {cond.indicatorKey}",
            )
