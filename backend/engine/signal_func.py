"""Builds the per-bar entry-signal closure from a strategy definition.

Lookups are dispatched through the indicator registry — no if/elif chain.
"""
from typing import Callable

import pandas as pd

from engine.indicators import registry as indicator_registry
from engine.stoploss import registry as stoploss_registry
from engine.targets import registry as target_registry

SignalFunc = Callable[[int, pd.DataFrame, bool], dict]
ManageFunc = Callable[[int, pd.DataFrame, dict], dict]


def build_manage_func(strategy_def: dict) -> ManageFunc:
    """Per-bar trade manager: returns {'new_sl': float|None, 'exit': bool}."""
    sl_type = strategy_def.get("slType", "SWING_LOW")
    max_bars = strategy_def.get("maxBarsInTrade")
    max_bars_int = int(max_bars) if max_bars else None

    def manage(i: int, df: pd.DataFrame, trade: dict) -> dict:
        entry_idx = trade.get("entry_idx", i)
        new_sl = stoploss_registry.get(sl_type).update(i, df, trade, strategy_def)
        time_exit = max_bars_int is not None and (i - entry_idx) >= max_bars_int
        return {"new_sl": new_sl, "exit": time_exit}

    return manage


def build(strategy_def: dict) -> SignalFunc:
    conditions = strategy_def.get("entryConditions", [])
    logic = strategy_def.get("conditionLogic", "AND")
    sl_type = strategy_def.get("slType", "SWING_LOW")
    target_type = strategy_def.get("targetType", "R_MULTIPLE")
    direction = strategy_def.get("direction", "LONG")
    reducer = all if logic == "AND" else any

    def signal_func(i: int, df: pd.DataFrame, in_trade: bool) -> dict:
        if in_trade or i < 3:
            return {"enter": False}

        try:
            passed = reducer(_evaluate(c, i, df) for c in conditions) if conditions else False
        except Exception as exc:
            print(f"Signal evaluation error at bar {i}: {exc}")
            return {"enter": False}

        if not passed:
            return {"enter": False}

        sl = stoploss_registry.compute(sl_type, i, df, strategy_def)
        entry = float(df.iloc[i]["close"])
        if direction == "SHORT":
            if sl <= entry:
                return {"enter": False}
        else:
            if sl >= entry:
                return {"enter": False}
        target = target_registry.compute(target_type, i, df, entry, sl, strategy_def)
        return {"enter": True, "sl": sl, "target": target, "direction": direction}

    return signal_func


def _evaluate(cond: dict, i: int, df: pd.DataFrame) -> bool:
    indicator = indicator_registry.get(cond.get("indicatorKey", ""))
    return indicator.evaluate(
        i=i,
        df=df,
        params=cond.get("params", {}) or {},
        operator=cond.get("operator", "OVER"),
        threshold=float(cond.get("threshold", 0)),
    )
