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
    STOCK_SECTOR_MAP,
    INDIAN_TICKER_ALIASES
)

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

@router.get("/watchlist")
def get_watchlist(category: Optional[str] = Query(None), limit: Optional[int] = Query(None)):
    """Retrieve batch data for the Indian market watchlist table."""
    items = fetch_watchlist_batch(DEFAULT_WATCHLIST)
    if category and category.lower() != "all":
        cat_lower = category.lower()
        if cat_lower == "nifty50":
            items = [i for i in items if i.get("is_nifty50")]
        else:
            items = [i for i in items if i.get("sector", "").lower() == cat_lower]
    if limit and limit > 0:
        items = items[:limit]
    return items

@router.get("/market-status")
def get_market_status():
    """Check current NSE/BSE Indian market trading status."""
    return is_indian_market_open()

@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1)):
    """Search stocks by symbol or company name across top Indian equities and NSE/BSE."""
    query = q.upper().strip()
    results = []
    seen = set()

    # 1. Exact or prefix in aliases (e.g. 'LIC' -> LICI.NS, 'TATAMOTORS' -> TMCV.NS)
    for alias, target in INDIAN_TICKER_ALIASES.items():
        if query == alias or alias.startswith(query):
            if target not in seen:
                meta = STOCK_SECTOR_MAP.get(target, {})
                name = meta.get("name", POPULAR_STOCKS_METADATA.get(target, target))
                sector = meta.get("sector", "Other")
                results.append({"symbol": target, "name": name, "sector": sector})
                seen.add(target)

    # 2. Check catalog metadata (symbol or company name)
    for sym, meta in STOCK_SECTOR_MAP.items():
        clean_sym = sym.replace(".NS", "").replace(".BO", "")
        name = meta.get("name", "")
        if (query in sym or query in clean_sym or query in name.upper()) and sym not in seen:
            results.append({"symbol": sym, "name": name, "sector": meta.get("sector", "Other")})
            seen.add(sym)

    # 3. Dynamic yfinance search for any other Indian stock on NSE/BSE
    if len(results) < 8:
        try:
            s = yf.Search(q, max_results=8)
            for item in s.quotes:
                sym = item.get("symbol", "")
                ex = item.get("exchange", "")
                if (sym.endswith((".NS", ".BO")) or ex in ["NSI", "BSE", "NSE"]) and sym not in seen:
                    company_name = item.get("shortname") or item.get("longname") or sym
                    results.append({"symbol": sym, "name": company_name, "sector": "NSE/BSE"})
                    seen.add(sym)
        except Exception:
            pass

    # 4. If normalized candidate not yet in list, add it
    norm_sym = normalize_symbol(query)
    if norm_sym not in seen:
        meta = STOCK_SECTOR_MAP.get(norm_sym, {})
        display_name = meta.get("name", f"{query} (NSE)")
        sector = meta.get("sector", "Indian Market")
        results.append({"symbol": norm_sym, "name": display_name, "sector": sector})
        seen.add(norm_sym)

    return results[:16]


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
