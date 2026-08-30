"""Runtime registry over Indicator subclasses."""
from engine.indicators.base import Indicator
from dtos import IndicatorMetadata, IndicatorParam, ThresholdSuggestionDTO


def get(key: str) -> Indicator:
    cls = Indicator._registry.get(key)
    if cls is None:
        raise KeyError(f"Unknown indicator: {key}")
    return cls()


def all_keys() -> set[str]:
    return set(Indicator._registry.keys())


def metadata() -> list[IndicatorMetadata]:
    """Build the metadata list served to the frontend from registered classes."""
    return [
        IndicatorMetadata(
            key=cls.key,
            displayName=cls.display_name,
            description=cls.description,
            category=cls.category,
            executionSide="PYTHON",
            params=[
                IndicatorParam(
                    key=p.key,
                    label=p.label,
                    type=p.type,
                    defaultValue=p.defaultValue,
                    min=p.min,
                    max=p.max,
                    enumValues=p.enumValues,
                    help=p.help,
                )
                for p in cls.params
            ],
            usesThreshold=cls.uses_threshold,
            thresholdLabel=cls.threshold_label,
            thresholdHelp=cls.threshold_help,
            thresholdMin=cls.threshold_min,
            thresholdMax=cls.threshold_max,
            defaultThreshold=cls.default_threshold,
            thresholdSuggestions=[
                ThresholdSuggestionDTO(label=s.label, value=s.value)
                for s in cls.threshold_suggestions
            ],
        )
        for cls in Indicator._registry.values()
    ]
