import pandas as pd
import numpy as np
from typing import Dict, Any, List

def calculate_sma(series: pd.Series, window: int) -> pd.Series:
    """Calculate Simple Moving Average."""
    return series.rolling(window=window, min_periods=1).mean()

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index using Wilder's smoothing."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    # Wilder's exponential smoothing
    avg_gain = gain.ewm(alpha=1/period, min_periods=1, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=1, adjust=False).mean()
    
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    # Replace NaN or inf with neutral 50
    rsi = rsi.fillna(50.0).clip(0, 100)
    return rsi

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
    """Calculate MACD line, Signal line, and MACD Histogram."""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return {
        "macd": macd_line,
        "signal": signal_line,
        "hist": hist
    }

def enrich_stock_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Enrich OHLCV DataFrame with SMA_20, SMA_50, RSI_14, and MACD indicators.
    """
    if df.empty or 'Close' not in df.columns:
        return df
    
    enriched = df.copy()
    close = enriched['Close']
    
    enriched['SMA_20'] = calculate_sma(close, 20)
    enriched['SMA_50'] = calculate_sma(close, 50)
    enriched['RSI_14'] = calculate_rsi(close, 14)
    
    macd_dict = calculate_macd(close, fast=12, slow=26, signal=9)
    enriched['MACD'] = macd_dict['macd']
    enriched['MACD_Signal'] = macd_dict['signal']
    enriched['MACD_Hist'] = macd_dict['hist']
    
    return enriched

def get_latest_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Extract the latest computed indicators from the enriched DataFrame.
    """
    if df.empty:
        return {}
    
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    
    price = float(latest['Close'])
    prev_price = float(prev['Close'])
    sma_20 = float(latest.get('SMA_20', price))
    sma_50 = float(latest.get('SMA_50', price))
    rsi = float(latest.get('RSI_14', 50.0))
    macd = float(latest.get('MACD', 0.0))
    macd_signal = float(latest.get('MACD_Signal', 0.0))
    macd_hist = float(latest.get('MACD_Hist', 0.0))
    
    prev_sma_20 = float(prev.get('SMA_20', sma_20))
    prev_sma_50 = float(prev.get('SMA_50', sma_50))
    prev_macd = float(prev.get('MACD', macd))
    prev_signal = float(prev.get('MACD_Signal', macd_signal))
    
    return {
        "price": price,
        "prev_price": prev_price,
        "sma_20": round(sma_20, 2),
        "sma_50": round(sma_50, 2),
        "rsi_14": round(rsi, 2),
        "macd": round(macd, 4),
        "macd_signal": round(macd_signal, 4),
        "macd_hist": round(macd_hist, 4),
        "prev_sma_20": round(prev_sma_20, 2),
        "prev_sma_50": round(prev_sma_50, 2),
        "prev_macd": round(prev_macd, 4),
        "prev_signal": round(prev_signal, 4),
    }
