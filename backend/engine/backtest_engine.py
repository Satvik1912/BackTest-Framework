"""Single-pass long-only backtest engine.

The engine knows nothing about indicators — it just calls the supplied
signal_func at each bar. SRP: this class only owns the simulation loop.
"""
from typing import Callable, Optional

import pandas as pd

SignalFunc = Callable[[int, pd.DataFrame, bool], dict]
ManageFunc = Callable[[int, pd.DataFrame, dict], dict]


class BacktestEngine:
    def __init__(
        self,
        data: pd.DataFrame,
        rr: float,
        signal_func: SignalFunc,
        manage_func: Optional[ManageFunc] = None,
    ):
        self._df = data
        self._rr = rr
        self._signal = signal_func
        self._manage = manage_func

    def run(self) -> list[dict]:
        trades: list[dict] = []
        in_trade = False
        trade: dict | None = None

        for i in range(len(self._df)):
            candle = self._df.iloc[i]

            if in_trade and trade is not None:
                is_short = trade.get("direction") == "SHORT"
                if self._manage is not None:
                    decision = self._manage(i, self._df, trade)
                    new_sl = decision.get("new_sl")
                    close_px = float(candle["close"])
                    if new_sl is not None:
                        if is_short and new_sl < trade["sl"] and new_sl > close_px:
                            trade["sl"] = float(new_sl)
                        elif not is_short and new_sl > trade["sl"] and new_sl < close_px:
                            trade["sl"] = float(new_sl)
                    if decision.get("exit"):
                        trades.append(self._close(trade, candle, close_px, "TIME_EXIT"))
                        in_trade = False
                        continue

                if is_short:
                    if candle["high"] >= trade["sl"]:
                        trades.append(self._close(trade, candle, trade["sl"], "STOPLOSS"))
                        in_trade = False
                    elif candle["low"] <= trade["target"]:
                        trades.append(self._close(trade, candle, trade["target"], "TARGET"))
                        in_trade = False
                else:
                    if candle["low"] <= trade["sl"]:
                        trades.append(self._close(trade, candle, trade["sl"], "STOPLOSS"))
                        in_trade = False
                    elif candle["high"] >= trade["target"]:
                        trades.append(self._close(trade, candle, trade["target"], "TARGET"))
                        in_trade = False
                continue

            signal = self._signal(i, self._df, in_trade)
            if not signal.get("enter"):
                continue

            entry = float(candle["close"])
            sl = float(signal["sl"])
            direction = signal.get("direction", "LONG")
            if direction == "SHORT":
                if sl <= entry:
                    continue
            else:
                if sl >= entry:
                    continue
            target = float(signal.get("target") or (entry + self._rr * (entry - sl)))
            if direction == "SHORT" and target >= entry:
                continue
            if direction != "SHORT" and target <= entry:
                continue
            trade = {
                "entry_time": str(candle["datetime"]),
                "entry_idx": i,
                "entry_price": entry,
                "sl": sl,
                "target": target,
                "direction": direction,
            }
            in_trade = True

        return trades

    @staticmethod
    def _close(trade: dict, candle, exit_price: float, result: str) -> dict:
        out = {**trade, "exit_time": str(candle["datetime"]),
               "exit_price": float(exit_price), "result": result}
        out.pop("entry_idx", None)
        return out

