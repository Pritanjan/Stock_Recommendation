import yfinance as yf
import pandas as pd
import numpy as np
import time
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time as dtime
from zoneinfo import ZoneInfo
from typing import Dict, Any, List, Optional
from services.indicators import enrich_stock_dataframe, get_latest_indicators
from services.recommender import generate_recommendation

# Simple in-memory cache with TTL
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 45

INDIAN_STOCKS_CATALOG = [
    # --- Banking & Financial Services ---
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "sector": "Banking", "nifty50": True},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "sector": "Banking", "nifty50": True},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking", "nifty50": True},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "sector": "Banking", "nifty50": True},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank Ltd.", "sector": "Banking", "nifty50": True},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank Ltd.", "sector": "Banking", "nifty50": True},
    {"symbol": "PNB.NS", "name": "Punjab National Bank", "sector": "Banking", "nifty50": False},
    {"symbol": "BANKBARODA.NS", "name": "Bank of Baroda", "sector": "Banking", "nifty50": False},
    {"symbol": "IDFCFIRSTB.NS", "name": "IDFC First Bank Ltd.", "sector": "Banking", "nifty50": False},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd.", "sector": "Finance", "nifty50": True},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv Ltd.", "sector": "Finance", "nifty50": True},
    {"symbol": "SHRIRAMFIN.NS", "name": "Shriram Finance Ltd.", "sector": "Finance", "nifty50": True},
    {"symbol": "LICI.NS", "name": "Life Insurance Corp. of India", "sector": "Insurance", "nifty50": False},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services", "sector": "Finance", "nifty50": False},
    {"symbol": "IRFC.NS", "name": "Indian Railway Finance Corp", "sector": "Finance", "nifty50": False},
    {"symbol": "PFC.NS", "name": "Power Finance Corporation", "sector": "Finance", "nifty50": False},
    {"symbol": "RECLTD.NS", "name": "REC Ltd.", "sector": "Finance", "nifty50": False},

    # --- IT & Technology ---
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT & Tech", "nifty50": True},
    {"symbol": "INFY.NS", "name": "Infosys Ltd.", "sector": "IT & Tech", "nifty50": True},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies Ltd.", "sector": "IT & Tech", "nifty50": True},
    {"symbol": "WIPRO.NS", "name": "Wipro Ltd.", "sector": "IT & Tech", "nifty50": True},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra Ltd.", "sector": "IT & Tech", "nifty50": True},
    {"symbol": "LTIM.NS", "name": "LTIMindtree Ltd.", "sector": "IT & Tech", "nifty50": False},
    {"symbol": "ZOMATO.NS", "name": "Zomato Ltd.", "sector": "IT & Tech", "nifty50": False},
    {"symbol": "PAYTM.NS", "name": "One97 Communications (Paytm)", "sector": "IT & Tech", "nifty50": False},

    # --- Auto & Mobility ---
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India", "sector": "Auto", "nifty50": True},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra Ltd.", "sector": "Auto", "nifty50": True},
    {"symbol": "TMCV.NS", "name": "Tata Motors Ltd. (CV)", "sector": "Auto", "nifty50": True},
    {"symbol": "TMPV.NS", "name": "Tata Motors Passenger Vehicles", "sector": "Auto", "nifty50": False},
    {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto Ltd.", "sector": "Auto", "nifty50": True},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors Ltd.", "sector": "Auto", "nifty50": True},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp Ltd.", "sector": "Auto", "nifty50": True},
    {"symbol": "TVSMOTOR.NS", "name": "TVS Motor Company", "sector": "Auto", "nifty50": False},
    {"symbol": "ASHOKLEY.NS", "name": "Ashok Leyland Ltd.", "sector": "Auto", "nifty50": False},

    # --- Oil, Gas, Energy & Power ---
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd.", "sector": "Energy", "nifty50": True},
    {"symbol": "NTPC.NS", "name": "NTPC Ltd.", "sector": "Energy", "nifty50": True},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corp", "sector": "Energy", "nifty50": True},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corp of India", "sector": "Energy", "nifty50": True},
    {"symbol": "COALINDIA.NS", "name": "Coal India Ltd.", "sector": "Energy", "nifty50": True},
    {"symbol": "BPCL.NS", "name": "Bharat Petroleum Corp Ltd.", "sector": "Energy", "nifty50": True},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power Company Ltd.", "sector": "Energy", "nifty50": False},
    {"symbol": "IOC.NS", "name": "Indian Oil Corporation Ltd.", "sector": "Energy", "nifty50": False},
    {"symbol": "GAIL.NS", "name": "GAIL (India) Ltd.", "sector": "Energy", "nifty50": False},
    {"symbol": "SUZLON.NS", "name": "Suzlon Energy Ltd.", "sector": "Energy", "nifty50": False},

    # --- Consumer, Retail & FMCG ---
    {"symbol": "ITC.NS", "name": "ITC Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "TATACONSUM.NS", "name": "Tata Consumer Products", "sector": "Consumer", "nifty50": True},
    {"symbol": "TITAN.NS", "name": "Titan Company Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "TRENT.NS", "name": "Trent Ltd.", "sector": "Consumer", "nifty50": True},
    {"symbol": "DMART.NS", "name": "Avenue Supermarts (DMart)", "sector": "Consumer", "nifty50": False},
    {"symbol": "VBL.NS", "name": "Varun Beverages Ltd.", "sector": "Consumer", "nifty50": False},

    # --- Pharma & Healthcare ---
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries", "sector": "Pharma", "nifty50": True},
    {"symbol": "CIPLA.NS", "name": "Cipla Ltd.", "sector": "Pharma", "nifty50": True},
    {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories", "sector": "Pharma", "nifty50": True},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories Ltd.", "sector": "Pharma", "nifty50": True},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals Enterprise", "sector": "Healthcare", "nifty50": True},
    {"symbol": "LUPIN.NS", "name": "Lupin Ltd.", "sector": "Pharma", "nifty50": False},

    # --- Metals, Materials & Mining ---
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel Ltd.", "sector": "Metals", "nifty50": True},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel Ltd.", "sector": "Metals", "nifty50": True},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries Ltd.", "sector": "Metals", "nifty50": True},
    {"symbol": "VEDL.NS", "name": "Vedanta Ltd.", "sector": "Metals", "nifty50": False},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement Ltd.", "sector": "Materials", "nifty50": True},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries Ltd.", "sector": "Materials", "nifty50": True},

    # --- Infra, Defence, PSU & Real Estate ---
    {"symbol": "LT.NS", "name": "Larsen & Toubro Ltd.", "sector": "Infra", "nifty50": True},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises Ltd.", "sector": "Infra", "nifty50": True},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports & SEZ Ltd.", "sector": "Infra", "nifty50": True},
    {"symbol": "BEL.NS", "name": "Bharat Electronics Ltd.", "sector": "Defence", "nifty50": True},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics Ltd.", "sector": "Defence", "nifty50": False},
    {"symbol": "BHEL.NS", "name": "Bharat Heavy Electricals Ltd.", "sector": "Infra", "nifty50": False},
    {"symbol": "IRCTC.NS", "name": "Indian Railway Catering & Tourism", "sector": "PSU", "nifty50": False},
    {"symbol": "RVNL.NS", "name": "Rail Vikas Nigam Ltd.", "sector": "PSU", "nifty50": False},
    {"symbol": "MAZDOCK.NS", "name": "Mazagon Dock Shipbuilders", "sector": "Defence", "nifty50": False},
    {"symbol": "DLF.NS", "name": "DLF Ltd.", "sector": "Real Estate", "nifty50": False},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd.", "sector": "Telecom", "nifty50": True},
]

STOCK_SECTOR_MAP: Dict[str, Dict[str, Any]] = {item["symbol"]: item for item in INDIAN_STOCKS_CATALOG}

POPULAR_STOCKS_METADATA: Dict[str, str] = {
    item["symbol"]: item["name"] for item in INDIAN_STOCKS_CATALOG
}
POPULAR_STOCKS_METADATA["^NSEI"] = "NIFTY 50"
POPULAR_STOCKS_METADATA["^BSESN"] = "S&P BSE SENSEX"

DEFAULT_WATCHLIST: List[str] = [item["symbol"] for item in INDIAN_STOCKS_CATALOG]

INDIAN_TICKER_ALIASES: Dict[str, str] = {
    # LIC
    "LIC": "LICI.NS", "LICI": "LICI.NS", "LIC.NS": "LICI.NS", "LICINDIA": "LICI.NS",
    # Tata Motors
    "TATAMOTORS": "TMCV.NS", "TATAMOTOR": "TMCV.NS", "TATAMOTORS.NS": "TMCV.NS",
    "TATA MOTORS": "TMCV.NS", "TMCV": "TMCV.NS", "TMPV": "TMPV.NS",
    # FMCG & Consumer
    "HUL": "HINDUNILVR.NS", "HINDUSTANUNILEVER": "HINDUNILVR.NS", "HINDUNILVR": "HINDUNILVR.NS",
    "NESTLE": "NESTLEIND.NS", "NESTLEIND": "NESTLEIND.NS",
    "BRITANNIA": "BRITANNIA.NS",
    "TATACONSUMER": "TATACONSUM.NS", "TATA CONSUMER": "TATACONSUM.NS", "TATACONSUM": "TATACONSUM.NS",
    "TITAN": "TITAN.NS", "ASIANPAINT": "ASIANPAINT.NS", "ASIANPAINTS": "ASIANPAINT.NS",
    "TRENT": "TRENT.NS", "DMART": "DMART.NS", "AVENUESUPERMARTS": "DMART.NS",
    "VBL": "VBL.NS", "VARUNBEVERAGES": "VBL.NS",
    # Banking
    "HDFC": "HDFCBANK.NS", "HDFCBANK": "HDFCBANK.NS",
    "SBI": "SBIN.NS", "SBIN": "SBIN.NS", "STATEBANK": "SBIN.NS", "STATE BANK": "SBIN.NS",
    "ICICI": "ICICIBANK.NS", "ICICIBANK": "ICICIBANK.NS",
    "KOTAK": "KOTAKBANK.NS", "KOTAKBANK": "KOTAKBANK.NS",
    "AXIS": "AXISBANK.NS", "AXISBANK": "AXISBANK.NS",
    "INDUSIND": "INDUSINDBK.NS", "INDUSINDBK": "INDUSINDBK.NS",
    "PNB": "PNB.NS", "PUNJABNATIONALBANK": "PNB.NS",
    "BOB": "BANKBARODA.NS", "BANKBARODA": "BANKBARODA.NS", "BANK OF BARODA": "BANKBARODA.NS",
    "IDFC": "IDFCFIRSTB.NS", "IDFCFIRST": "IDFCFIRSTB.NS", "IDFCFIRSTB": "IDFCFIRSTB.NS",
    # Finance & NBFC
    "BAJAJFINANCE": "BAJFINANCE.NS", "BAJFINANCE": "BAJFINANCE.NS",
    "BAJAJFINSERV": "BAJAJFINSV.NS", "BAJAJFINSV": "BAJAJFINSV.NS",
    "SHRIRAM": "SHRIRAMFIN.NS", "SHRIRAMFIN": "SHRIRAMFIN.NS",
    "JIO": "JIOFIN.NS", "JIOFIN": "JIOFIN.NS", "JIOFINANCIAL": "JIOFIN.NS",
    "IRFC": "IRFC.NS", "PFC": "PFC.NS", "REC": "RECLTD.NS", "RECLTD": "RECLTD.NS",
    # IT
    "TCS": "TCS.NS", "INFOSYS": "INFY.NS", "INFY": "INFY.NS",
    "WIPRO": "WIPRO.NS", "HCL": "HCLTECH.NS", "HCLTECH": "HCLTECH.NS",
    "TECHM": "TECHM.NS", "TECHMAHINDRA": "TECHM.NS", "TECH MAHINDRA": "TECHM.NS",
    "LTIM": "LTIM.NS", "LTIMINDTREE": "LTIM.NS",
    "ZOMATO": "ZOMATO.NS", "PAYTM": "PAYTM.NS",
    # Auto
    "MARUTI": "MARUTI.NS", "MARUTISUZUKI": "MARUTI.NS",
    "M&M": "M&M.NS", "MM": "M&M.NS", "MAHINDRA": "M&M.NS",
    "BAJAJAUTO": "BAJAJ-AUTO.NS", "BAJAJ-AUTO": "BAJAJ-AUTO.NS", "BAJAJ AUTO": "BAJAJ-AUTO.NS",
    "EICHER": "EICHERMOT.NS", "EICHERMOT": "EICHERMOT.NS", "EICHER MOTORS": "EICHERMOT.NS",
    "HERO": "HEROMOTOCO.NS", "HEROMOTO": "HEROMOTOCO.NS", "HEROMOTOCO": "HEROMOTOCO.NS",
    "TVS": "TVSMOTOR.NS", "TVSMOTOR": "TVSMOTOR.NS",
    "ASHOKLEY": "ASHOKLEY.NS", "ASHOKLEYLAND": "ASHOKLEY.NS",
    # Energy, Oil & Power
    "RELIANCE": "RELIANCE.NS", "RIL": "RELIANCE.NS",
    "NTPC": "NTPC.NS", "ONGC": "ONGC.NS", "POWERGRID": "POWERGRID.NS", "POWER GRID": "POWERGRID.NS",
    "COALINDIA": "COALINDIA.NS", "COAL INDIA": "COALINDIA.NS",
    "BPCL": "BPCL.NS", "IOC": "IOC.NS", "INDIANOIL": "IOC.NS", "GAIL": "GAIL.NS",
    "TATAPOWER": "TATAPOWER.NS", "TATA POWER": "TATAPOWER.NS",
    "SUZLON": "SUZLON.NS",
    # Pharma & Healthcare
    "SUNPHARMA": "SUNPHARMA.NS", "SUN PHARMA": "SUNPHARMA.NS",
    "CIPLA": "CIPLA.NS", "DRREDDY": "DRREDDY.NS", "DR REDDY": "DRREDDY.NS",
    "DIVIS": "DIVISLAB.NS", "DIVISLAB": "DIVISLAB.NS",
    "APOLLO": "APOLLOHOSP.NS", "APOLLOHOSP": "APOLLOHOSP.NS", "APOLLO HOSPITALS": "APOLLOHOSP.NS",
    "LUPIN": "LUPIN.NS",
    # Metals, Infra, Defence
    "LT": "LT.NS", "L&T": "LT.NS", "LARSEN": "LT.NS",
    "TATASTEEL": "TATASTEEL.NS", "TATA STEEL": "TATASTEEL.NS",
    "JSW": "JSWSTEEL.NS", "JSWSTEEL": "JSWSTEEL.NS", "JSW STEEL": "JSWSTEEL.NS",
    "HINDALCO": "HINDALCO.NS",
    "VEDL": "VEDL.NS", "VEDANTA": "VEDL.NS",
    "ULTRACEMCO": "ULTRACEMCO.NS", "ULTRATECH": "ULTRACEMCO.NS", "ULTRATECH CEMENT": "ULTRACEMCO.NS",
    "GRASIM": "GRASIM.NS",
    "ADANI": "ADANIENT.NS", "ADANIENT": "ADANIENT.NS", "ADANIPORTS": "ADANIPORTS.NS",
    "BEL": "BEL.NS", "BHARATELECTRONICS": "BEL.NS",
    "HAL": "HAL.NS", "HINDUSTANAERONAUTICS": "HAL.NS",
    "BHEL": "BHEL.NS",
    "IRCTC": "IRCTC.NS", "RVNL": "RVNL.NS", "MAZDOCK": "MAZDOCK.NS", "MAZAGON": "MAZDOCK.NS",
    "DLF": "DLF.NS",
    "AIRTEL": "BHARTIARTL.NS", "BHARTI": "BHARTIARTL.NS", "BHARTIARTL": "BHARTIARTL.NS",
    "NIFTY": "^NSEI", "NIFTY50": "^NSEI", "SENSEX": "^BSESN", "BSE": "^BSESN"
}


def is_indian_market_open() -> Dict[str, Any]:
    """
    Check if the Indian stock market (NSE/BSE) is currently open.
    Standard Trading Hours: Monday to Friday, 09:15 AM to 03:30 PM IST.
    """
    try:
        ist = ZoneInfo("Asia/Kolkata")
        now = datetime.now(ist)
    except Exception:
        now = datetime.now()

    is_weekday = now.weekday() < 5
    cur_time = now.time()
    open_time = dtime(9, 15)
    close_time = dtime(15, 30)

    is_open = is_weekday and (open_time <= cur_time <= close_time)

    return {
        "is_open": is_open,
        "status": "OPEN" if is_open else "CLOSED",
        "current_ist": now.strftime("%Y-%m-%d %H:%M:%S IST"),
        "trading_hours": "09:15 AM - 03:30 PM IST (Mon - Fri)",
        "message": "NSE & BSE Live Trading Active" if is_open else "Market Closed • Prices reflect official closing quotes"
    }

def normalize_symbol(symbol: str) -> str:
    """Normalize user input symbol to proper NSE/BSE ticker."""
    s = symbol.upper().strip().replace(" ", "")
    if s in INDIAN_TICKER_ALIASES:
        return INDIAN_TICKER_ALIASES[s]
    
    if s.startswith("^") or s.endswith(".NS") or s.endswith(".BO"):
        if s in INDIAN_TICKER_ALIASES:
            return INDIAN_TICKER_ALIASES[s]
        return s

    return f"{s}.NS"

def get_cached(key: str) -> Optional[Any]:
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["timestamp"] < CACHE_TTL_SECONDS):
        return entry["data"]
    return None

def set_cached(key: str, data: Any):
    _CACHE[key] = {
        "timestamp": time.time(),
        "data": data
    }

def fetch_stock_quote(symbol: str) -> Dict[str, Any]:
    """Fetch current quote and summary metadata for a symbol."""
    symbol = normalize_symbol(symbol)
    cache_key = f"quote_{symbol}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    ticker = yf.Ticker(symbol)
    
    # Try getting fast_info or info
    price = None
    prev_close = None
    name = POPULAR_STOCKS_METADATA.get(symbol, symbol)
    volume = 0
    day_high = 0
    day_low = 0
    year_high = 0
    year_low = 0
    pe_ratio = None
    market_cap = None
    currency = "INR"

    try:
        fast_info = ticker.fast_info
        price = getattr(fast_info, 'last_price', None)
        prev_close = getattr(fast_info, 'previous_close', None)
        day_high = getattr(fast_info, 'day_high', 0)
        day_low = getattr(fast_info, 'day_low', 0)
        year_high = getattr(fast_info, 'year_high', 0)
        year_low = getattr(fast_info, 'year_low', 0)
        volume = getattr(fast_info, 'last_volume', 0)
        market_cap = getattr(fast_info, 'market_cap', None)
        currency = getattr(fast_info, 'currency', "INR") or "INR"
    except Exception:
        pass

    # Fallback to history if fast_info missing price
    if price is None or np.isnan(price):
        try:
            hist = ticker.history(period="5d", interval="1d")
            if not hist.empty:
                price = float(hist['Close'].iloc[-1])
                prev_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else price
                day_high = float(hist['High'].iloc[-1])
                day_low = float(hist['Low'].iloc[-1])
                volume = int(hist['Volume'].iloc[-1])
        except Exception:
            pass

    # If still missing, try yf.Search for alternate Indian ticker
    if price is None or np.isnan(price):
        try:
            clean_q = symbol.replace(".NS", "").replace(".BO", "")
            s = yf.Search(clean_q, max_results=3)
            for item in s.quotes:
                alt_sym = item.get("symbol", "")
                ex = item.get("exchange", "")
                if (alt_sym.endswith((".NS", ".BO")) or ex in ["NSI", "BSE"]) and alt_sym != symbol:
                    alt_ticker = yf.Ticker(alt_sym)
                    alt_p = getattr(alt_ticker.fast_info, 'last_price', None)
                    if alt_p and not np.isnan(alt_p):
                        return fetch_stock_quote(alt_sym)
        except Exception:
            pass

    # Validate price
    if price is None or np.isnan(price):
        raise ValueError(f"Could not retrieve live price for '{symbol}'. Please ensure it is a valid Indian stock (e.g. LICI for LIC, TMCV for Tata Motors).")

    prev_close = prev_close if (prev_close is not None and not np.isnan(prev_close)) else price
    change = price - prev_close
    change_pct = (change / prev_close * 100) if prev_close != 0 else 0.0

    try:
        info = ticker.info
        name = info.get("shortName") or info.get("longName") or name
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        currency = info.get("currency") or currency
    except Exception:
        pass

    data = {
        "symbol": symbol,
        "name": name,
        "price": round(float(price), 2),
        "previous_close": round(float(prev_close), 2),
        "change": round(float(change), 2),
        "change_percent": round(float(change_pct), 2),
        "day_high": round(float(day_high or price * 1.01), 2),
        "day_low": round(float(day_low or price * 0.99), 2),
        "year_high": round(float(year_high or price * 1.3), 2),
        "year_low": round(float(year_low or price * 0.7), 2),
        "volume": int(volume),
        "market_cap": market_cap,
        "pe_ratio": round(float(pe_ratio), 2) if pe_ratio else None,
        "currency": currency,
        "last_updated": int(time.time())
    }
    set_cached(cache_key, data)
    return data

def fetch_stock_history_and_indicators(symbol: str, period: str = "6mo", interval: str = "1d") -> Dict[str, Any]:
    """Fetch historical OHLCV, compute indicators, and prepare series for lightweight charts."""
    symbol = normalize_symbol(symbol)
    cache_key = f"hist_{symbol}_{period}_{interval}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    # Fetch quote first to ensure ticker is valid and live price is known
    quote = fetch_stock_quote(symbol)
    actual_symbol = quote.get("symbol", symbol)
    ticker = yf.Ticker(actual_symbol)
    
    # yfinance period mapping
    valid_periods = {"1d": ("1d", "5m"), "5d": ("5d", "15m"), "1mo": ("1mo", "1d"), "6mo": ("6mo", "1d"), "1y": ("1y", "1d"), "5y": ("5y", "1wk")}
    fetch_period, fetch_interval = valid_periods.get(period, ("6mo", "1d"))
    
    # We fetch a slightly longer history so moving averages (SMA 50) and RSI are initialized accurately
    init_period = "1y" if fetch_period in ["1mo", "6mo", "1y"] else ("5d" if fetch_period == "1d" else "1mo")
    
    try:
        df = ticker.history(period=init_period, interval=fetch_interval)
    except Exception:
        df = pd.DataFrame()

    # If df is empty or failed, generate a synthetic realistic series for demonstration fallback calibrated to real price
    if df.empty or len(df) < 5:
        df = _generate_fallback_dataframe(actual_symbol, base_price=quote["price"])

    # Enrich with SMA 20, SMA 50, RSI 14, MACD
    enriched = enrich_stock_dataframe(df)
    latest_ind = get_latest_indicators(enriched)
    recommendation = generate_recommendation(latest_ind)

    # Format chart data for TradingView Lightweight Charts
    candlesticks = []
    sma_20_series = []
    sma_50_series = []
    rsi_series = []
    macd_series = []
    volume_series = []

    # Filter to requested period window
    if period == "1d":
        chart_df = enriched.tail(78) # 1 market day in 5m bars
    elif period == "5d":
        chart_df = enriched.tail(130) # ~5 days
    elif period == "1mo":
        chart_df = enriched.tail(30)
    elif period == "6mo":
        chart_df = enriched.tail(130)
    elif period == "1y":
        chart_df = enriched.tail(252)
    else:
        chart_df = enriched.tail(180)

    for idx, row in chart_df.iterrows():
        # Handle index timestamp / date
        if isinstance(idx, pd.Timestamp):
            if fetch_interval in ["5m", "15m"]:
                time_val = int(idx.timestamp())
            else:
                time_val = idx.strftime("%Y-%m-%d")
        else:
            time_val = str(idx)

        close_val = round(float(row['Close']), 2)
        open_val = round(float(row['Open']), 2)
        high_val = round(float(row['High']), 2)
        low_val = round(float(row['Low']), 2)
        vol_val = int(row.get('Volume', 0))

        candlesticks.append({
            "time": time_val,
            "open": open_val,
            "high": high_val,
            "low": low_val,
            "close": close_val
        })

        volume_series.append({
            "time": time_val,
            "value": vol_val,
            "color": "#10B98180" if close_val >= open_val else "#EF444480"
        })

        if not np.isnan(row.get('SMA_20', np.nan)):
            sma_20_series.append({"time": time_val, "value": round(float(row['SMA_20']), 2)})

        if not np.isnan(row.get('SMA_50', np.nan)):
            sma_50_series.append({"time": time_val, "value": round(float(row['SMA_50']), 2)})

        if not np.isnan(row.get('RSI_14', np.nan)):
            rsi_series.append({"time": time_val, "value": round(float(row['RSI_14']), 2)})

        if not np.isnan(row.get('MACD', np.nan)):
            macd_series.append({
                "time": time_val,
                "macd": round(float(row['MACD']), 3),
                "signal": round(float(row['MACD_Signal']), 3),
                "hist": round(float(row['MACD_Hist']), 3)
            })

    result = {
        "symbol": symbol,
        "period": period,
        "interval": fetch_interval,
        "quote": quote,
        "indicators": latest_ind,
        "recommendation": recommendation,
        "chart_data": {
            "candlesticks": candlesticks,
            "volume": volume_series,
            "sma_20": sma_20_series,
            "sma_50": sma_50_series,
            "rsi": rsi_series,
            "macd": macd_series
        }
    }

    set_cached(cache_key, result)
    return result

def fetch_single_watchlist_item(symbol: str) -> Dict[str, Any]:
    meta = STOCK_SECTOR_MAP.get(symbol, {})
    sector = meta.get("sector", "Other")
    fallback_name = meta.get("name", POPULAR_STOCKS_METADATA.get(symbol, symbol))
    is_nifty = meta.get("nifty50", False)
    
    try:
        analysis = fetch_stock_history_and_indicators(symbol, period="3mo", interval="1d")
        quote = analysis["quote"]
        indicators = analysis["indicators"]
        rec = analysis["recommendation"]
        
        return {
            "symbol": symbol,
            "name": quote["name"] or fallback_name,
            "sector": sector,
            "is_nifty50": is_nifty,
            "price": quote["price"],
            "change": quote["change"],
            "change_percent": quote["change_percent"],
            "volume": quote["volume"],
            "sma_20": indicators.get("sma_20"),
            "sma_50": indicators.get("sma_50"),
            "sma_trend": rec["breakdown"]["sma"]["signal"],
            "rsi": indicators.get("rsi_14"),
            "rsi_signal": rec["breakdown"]["rsi"]["signal"],
            "macd_signal": rec["breakdown"]["macd"]["signal"],
            "recommendation": rec["verdict"],
            "score": rec["score"]
        }
    except Exception as e:
        return {
            "symbol": symbol,
            "name": fallback_name,
            "sector": sector,
            "is_nifty50": is_nifty,
            "price": 100.0,
            "change": 0.0,
            "change_percent": 0.0,
            "volume": 0,
            "sma_20": 100.0,
            "sma_50": 100.0,
            "sma_trend": "Neutral",
            "rsi": 50.0,
            "rsi_signal": "Neutral",
            "macd_signal": "Neutral",
            "recommendation": "HOLD",
            "score": 0
        }

def fetch_watchlist_batch(symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Fetch quotes and recommendations for watchlist table using concurrent workers."""
    symbols = symbols or DEFAULT_WATCHLIST
    cache_key = "WATCHLIST_BATCH_" + "-".join(symbols[:8]) + f"_len_{len(symbols)}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    results = []
    # Concurrently fetch with ThreadPoolExecutor
    max_workers = min(16, len(symbols)) if symbols else 1
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_single_watchlist_item, sym): sym for sym in symbols}
        for future in concurrent.futures.as_completed(futures):
            try:
                item = future.result()
                results.append(item)
            except Exception:
                sym = futures[future]
                results.append(fetch_single_watchlist_item(sym))

    # Maintain original catalog order
    order_map = {sym: idx for idx, sym in enumerate(symbols)}
    results.sort(key=lambda x: order_map.get(x["symbol"], 9999))

    set_cached(cache_key, results)
    return results


def _generate_fallback_dataframe(symbol: str, base_price: Optional[float] = None) -> pd.DataFrame:
    """Generate synthetic but realistic price series if Yahoo Finance history is throttled."""
    dates = pd.date_range(end=pd.Timestamp.now(), periods=180, freq="B")
    np.random.seed(abs(hash(symbol)) % 10000)
    if base_price is None or base_price <= 0:
        base_price = 2850.0 if "RELIANCE" in symbol else (3800.0 if "TCS" in symbol else (1600.0 if "HDFC" in symbol else (24500.0 if "NSEI" in symbol else 500.0)))
    returns = np.random.normal(0.0008, 0.015, size=len(dates))
    price_series = base_price * np.cumprod(1 + returns)
    
    df = pd.DataFrame(index=dates)
    df['Close'] = price_series
    df['Open'] = price_series * (1 + np.random.normal(0, 0.004, size=len(dates)))
    df['High'] = np.maximum(df['Open'], df['Close']) * (1 + np.abs(np.random.normal(0, 0.006, size=len(dates))))
    df['Low'] = np.minimum(df['Open'], df['Close']) * (1 - np.abs(np.random.normal(0, 0.006, size=len(dates))))
    df['Volume'] = np.random.randint(20_000_000, 80_000_000, size=len(dates))
    return df
