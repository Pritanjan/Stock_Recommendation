from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List, Optional
import asyncio
import json
import random
import yfinance as yf
from services.stock_service import (
    fetch_stock_quote,
    fetch_stock_history_and_indicators,
    fetch_watchlist_batch,
    normalize_symbol,
    is_indian_market_open,
    DEFAULT_WATCHLIST,
    POPULAR_STOCKS_METADATA,
    INDIAN_TICKER_ALIASES
)

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

@router.get("/watchlist")
def get_watchlist():
    """Retrieve full batch data for the watchlist table."""
    return fetch_watchlist_batch(DEFAULT_WATCHLIST)

@router.get("/market-status")
def get_market_status():
    """Check current NSE/BSE Indian market trading status."""
    return is_indian_market_open()

@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1)):
    """Search stocks by symbol or company name."""
    query = q.upper().strip()
    results = []
    seen = set()

    # 1. Check exact or prefix in aliases (e.g. 'LIC' -> LICI.NS)
    for alias, target in INDIAN_TICKER_ALIASES.items():
        if query == alias or alias.startswith(query):
            if target not in seen:
                name = POPULAR_STOCKS_METADATA.get(target, target)
                results.append({"symbol": target, "name": name})
                seen.add(target)

    # 2. Check in popular metadata
    for sym, name in POPULAR_STOCKS_METADATA.items():
        clean_sym = sym.replace(".NS", "").replace(".BO", "")
        if (query in sym or query in clean_sym or query in name.upper()) and sym not in seen:
            results.append({"symbol": sym, "name": name})
            seen.add(sym)

    # 3. Use yfinance search for dynamic Indian stocks if needed
    if len(results) < 4:
        try:
            s = yf.Search(q, max_results=5)
            for item in s.quotes:
                sym = item.get("symbol", "")
                ex = item.get("exchange", "")
                if (sym.endswith((".NS", ".BO")) or ex in ["NSI", "BSE"]) and sym not in seen:
                    company_name = item.get("shortname") or item.get("longname") or sym
                    results.append({"symbol": sym, "name": company_name})
                    seen.add(sym)
        except Exception:
            pass

    # 4. If normalized candidate not yet in list, add it
    norm_sym = normalize_symbol(query)
    if norm_sym not in seen:
        display_name = POPULAR_STOCKS_METADATA.get(norm_sym, f"{query} (NSE)")
        results.append({"symbol": norm_sym, "name": display_name})
        seen.add(norm_sym)

    return results[:8]

@router.get("/{symbol}")
def get_stock(symbol: str):
    """Retrieve current quote and recommendation for a specific ticker."""
    try:
        data = fetch_stock_history_and_indicators(symbol, period="1mo", interval="1d")
        return {
            "symbol": data["symbol"],
            "quote": data["quote"],
            "indicators": data["indicators"],
            "recommendation": data["recommendation"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock data for {symbol}: {str(e)}")

@router.get("/{symbol}/history")
def get_stock_history(
    symbol: str,
    period: str = Query("6mo", pattern="^(1d|5d|1mo|6mo|1y|5y)$"),
    interval: str = Query("1d", pattern="^(5m|15m|1d|1wk)$")
):
    """Retrieve historical candlesticks, SMA overlays, RSI, and MACD time series."""
    try:
        return fetch_stock_history_and_indicators(symbol, period=period, interval=interval)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock history for {symbol}: {str(e)}")

@router.websocket("/ws/{symbol}")
async def stock_websocket(websocket: WebSocket, symbol: str, simulate: bool = False):
    """
    WebSocket endpoint for real-time stock updates.
    When the Indian market is CLOSED, prices remain completely static at official close.
    If simulate=true is explicitly passed, provides demo tick pulses for off-market testing.
    """
    await websocket.accept()
    symbol = normalize_symbol(symbol)
    
    # Fetch base quote
    quote = fetch_stock_quote(symbol)
    curr_price = quote["price"]
    prev_close = quote["previous_close"]

    try:
        while True:
            market_info = is_indian_market_open()
            
            # When market is closed and simulation is not requested, keep price static!
            if not market_info["is_open"] and not simulate:
                payload = {
                    "type": "STATIC",
                    "symbol": symbol,
                    "price": curr_price,
                    "change": quote["change"],
                    "change_percent": quote["change_percent"],
                    "market_status": "CLOSED",
                    "market_message": market_info["message"],
                    "timestamp": asyncio.get_event_loop().time()
                }
                await websocket.send_text(json.dumps(payload))
                await asyncio.sleep(5.0)
            else:
                # Market is open OR simulation mode is explicitly enabled
                delta_pct = random.gauss(0, 0.0006)
                curr_price = max(1.0, round(curr_price * (1 + delta_pct), 2))
                change = round(curr_price - prev_close, 2)
                change_pct = round((change / prev_close * 100) if prev_close else 0.0, 2)
                
                payload = {
                    "type": "TICK",
                    "symbol": symbol,
                    "price": curr_price,
                    "change": change,
                    "change_percent": change_pct,
                    "market_status": "OPEN" if market_info["is_open"] else "SIMULATED",
                    "market_message": market_info["message"] if market_info["is_open"] else "Simulated Demo Ticks Active",
                    "timestamp": asyncio.get_event_loop().time()
                }
                await websocket.send_text(json.dumps(payload))
                await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
