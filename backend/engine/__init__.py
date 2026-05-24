from engine.indicators import all_keys
from engine.indicators.registry import metadata

INDICATORS = metadata()

# Backwards-compatible alias for the previous helper name
valid_keys = all_keys

__all__ = ["INDICATORS", "all_keys", "valid_keys"]
