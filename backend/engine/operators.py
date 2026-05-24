"""Comparison helpers shared by indicators."""


def apply_operator(value: float, operator: str, threshold: float) -> bool:
    if operator == "OVER":
        return value > threshold
    if operator == "UNDER":
        return value < threshold
    if operator == "EQUALS":
        return abs(value - threshold) < 0.001
    if operator == "CROSSES_ABOVE":
        return value > threshold
    if operator == "CROSSES_BELOW":
        return value < threshold
    return False


def crossed_above(curr_value: float, curr_ref: float,
                  prev_value: float, prev_ref: float) -> bool:
    return prev_value <= prev_ref and curr_value > curr_ref


def crossed_below(curr_value: float, curr_ref: float,
                  prev_value: float, prev_ref: float) -> bool:
    return prev_value >= prev_ref and curr_value < curr_ref
