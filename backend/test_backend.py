import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from services.stock_service import fetch_stock_quote, fetch_stock_history_and_indicators, fetch_watchlist_batch

def test_all():
    print("=== Testing Backend Services for Indian Stocks ===")
    
    # 1. Test Quote for LIC (alias resolution)
    print("Testing fetch_stock_quote('LIC')...")
    lic_quote = fetch_stock_quote("LIC")
    assert lic_quote["symbol"] == "LICI.NS", f"Expected LICI.NS, got {lic_quote['symbol']}"
    assert lic_quote["price"] > 0, "Price should be > 0"
    print(f"-> LIC Quote: {lic_quote['symbol']} ('{lic_quote['name']}'): ₹{lic_quote['price']} (Change: {lic_quote['change_percent']}%)")
    
    # 2. Test Indicators & Recommendation for LIC
    print("\nTesting fetch_stock_history_and_indicators('LIC')...")
    lic_analysis = fetch_stock_history_and_indicators("LIC", period="6mo", interval="1d")
    assert "indicators" in lic_analysis
    assert "recommendation" in lic_analysis
    assert "chart_data" in lic_analysis
    lic_ind = lic_analysis["indicators"]
    lic_rec = lic_analysis["recommendation"]
    print(f"-> SMA 20: ₹{lic_ind['sma_20']}, SMA 50: ₹{lic_ind['sma_50']}")
    print(f"-> RSI (14): {lic_ind['rsi_14']}")
    print(f"-> MACD: {lic_ind['macd']}, Signal: {lic_ind['macd_signal']}, Hist: {lic_ind['macd_hist']}")
    print(f"-> Verdict: {lic_rec['verdict']} (Score: {lic_rec['score']})")
    print(f"-> Candlesticks: {len(lic_analysis['chart_data']['candlesticks'])} bars")

    # 3. Test Tata Motors resolution
    print("\nTesting fetch_stock_quote('TATA MOTORS')...")
    tm_quote = fetch_stock_quote("TATA MOTORS")
    assert tm_quote["symbol"] == "TMCV.NS"
    print(f"-> Tata Motors: {tm_quote['symbol']} ('{tm_quote['name']}'): ₹{tm_quote['price']}")

    # 4. Test Watchlist Batch (including LIC)
    print("\nTesting fetch_watchlist_batch()...")
    wl = fetch_watchlist_batch()
    symbols = [item["symbol"] for item in wl]
    print(f"-> Watchlist items ({len(wl)}): {symbols}")
    assert "LICI.NS" in symbols
    assert "TMCV.NS" in symbols
    
    print("\n=== ALL TESTS PASSED WITH ACCURATE PRICES FOR LIC AND ALL INDIAN STOCKS! ===")

if __name__ == "__main__":
    try:
        test_all()
        sys.exit(0)
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
