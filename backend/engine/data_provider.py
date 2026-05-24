"""Market-data provider abstraction.

JobExecutor depends on the abstract MarketDataProvider, not on yfinance directly.
Swap the implementation when moving to a paid data source.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

import pandas as pd
import yfinance as yf


class MarketDataProvider(ABC):
    @abstractmethod
    def fetch(self, ticker: str, period: str, interval: str) -> pd.DataFrame:
        """Return a DataFrame with columns: datetime, open, high, low, close, volume."""


class YFinanceProvider(MarketDataProvider):
    def fetch(self, ticker: str, period: str, interval: str) -> pd.DataFrame:
        df = yf.download(tickers=ticker, period=period, interval=interval, progress=False)
        if df.empty:
            raise ValueError(f"No data returned for ticker: {ticker}")

        df = self._flatten_columns(df)
        df = self._normalize_datetime(df)
        df = self._normalize_ohlcv_names(df)
        self._require_columns(df, {"open", "high", "low", "close", "datetime"})

        df.sort_values("datetime", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    @staticmethod
    def _flatten_columns(df: pd.DataFrame) -> pd.DataFrame:
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [
                (col[0].lower() if isinstance(col, tuple) else col.lower())
                for col in df.columns
            ]
        else:
            df.columns = [c.lower() for c in df.columns]
        return df

    @staticmethod
    def _normalize_datetime(df: pd.DataFrame) -> pd.DataFrame:
        df = df.reset_index()
        dt_col = df.columns[0]
        df["datetime"] = pd.to_datetime(df[dt_col], utc=True).dt.tz_convert("Asia/Kolkata")
        if dt_col != "datetime":
            df = df.drop(columns=[dt_col])
        return df

    @staticmethod
    def _normalize_ohlcv_names(df: pd.DataFrame) -> pd.DataFrame:
        rename = {}
        for col in df.columns:
            c = col.lower()
            if c == "datetime":
                continue
            if "open" in c:
                rename[col] = "open"
            elif "high" in c:
                rename[col] = "high"
            elif "low" in c:
                rename[col] = "low"
            elif "close" in c and "adj" not in c:
                rename[col] = "close"
            elif "volume" in c:
                rename[col] = "volume"
        return df.rename(columns=rename)

    @staticmethod
    def _require_columns(df: pd.DataFrame, required: set[str]) -> None:
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Missing columns after fetch: {missing}")
