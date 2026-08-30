from fastapi import HTTPException

from constants import MAX_TICKERS
from dtos import StrategyDefinitionDTO
from engine import valid_keys


def validate(dto: StrategyDefinitionDTO) -> None:
    """Validate a strategy definition and normalize its tickers in place.

    Ensures `tickers` holds 1..MAX_TICKERS unique, upper-cased symbols and that
    `ticker` mirrors the first one (backward-compat / display).
    """
    _normalize_tickers(dto)

    keys = valid_keys()
    for cond in dto.entryConditions:
        if cond.indicatorKey not in keys:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown indicator key: {cond.indicatorKey}",
            )


def _normalize_tickers(dto: StrategyDefinitionDTO) -> None:
    # Accept either the new `tickers` list or the legacy single `ticker`.
    raw = list(dto.tickers) if dto.tickers else ([dto.ticker] if dto.ticker else [])

    seen: set[str] = set()
    cleaned: list[str] = []
    for t in raw:
        sym = (t or "").strip().upper()
        if sym and sym not in seen:
            seen.add(sym)
            cleaned.append(sym)

    if not cleaned:
        raise HTTPException(status_code=400, detail="At least one ticker is required")
    if len(cleaned) > MAX_TICKERS:
        raise HTTPException(
            status_code=400,
            detail=f"At most {MAX_TICKERS} tickers can be analyzed at once",
        )

    dto.tickers = cleaned
    dto.ticker = cleaned[0]
