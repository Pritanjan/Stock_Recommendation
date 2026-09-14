from typing import Dict, Any

def generate_recommendation(indicators: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a rule-based trading recommendation based on SMA 20/50, RSI 14, and MACD.
    Produces a verdict (Strong Buy, Buy, Hold, Sell, Strong Sell), score (-100 to 100),
    and per-indicator breakdowns with explanatory text.
    """
    price = indicators.get("price", 0.0)
    sma_20 = indicators.get("sma_20", price)
    sma_50 = indicators.get("sma_50", price)
    rsi = indicators.get("rsi_14", 50.0)
    macd = indicators.get("macd", 0.0)
    signal = indicators.get("macd_signal", 0.0)
    hist = indicators.get("macd_hist", 0.0)
    
    prev_sma_20 = indicators.get("prev_sma_20", sma_20)
    prev_sma_50 = indicators.get("prev_sma_50", sma_50)
    prev_macd = indicators.get("prev_macd", macd)
    prev_signal = indicators.get("prev_signal", signal)

    # 1. Evaluate SMA (Weight: ~35%)
    sma_score = 0
    sma_details = []
    
    # Golden cross check
    if prev_sma_20 <= prev_sma_50 and sma_20 > sma_50:
        sma_score += 35
        sma_details.append("Fresh Golden Cross detected (SMA 20 crossed above SMA 50).")
    elif prev_sma_20 >= prev_sma_50 and sma_20 < sma_50:
        sma_score -= 35
        sma_details.append("Fresh Death Cross detected (SMA 20 crossed below SMA 50).")
    elif sma_20 > sma_50:
        sma_score += 20
        sma_details.append(f"Bullish alignment: SMA 20 (₹{sma_20:.2f}) is above SMA 50 (₹{sma_50:.2f}).")
    else:
        sma_score -= 20
        sma_details.append(f"Bearish alignment: SMA 20 (₹{sma_20:.2f}) is below SMA 50 (₹{sma_50:.2f}).")
        
    # Price vs SMAs
    if price > sma_20 and price > sma_50:
        sma_score += 15
        sma_details.append(f"Price (₹{price:.2f}) trades comfortably above both 20 and 50 SMAs.")
    elif price < sma_20 and price < sma_50:
        sma_score -= 15
        sma_details.append(f"Price (₹{price:.2f}) trades below both 20 and 50 SMAs.")
    elif price > sma_20:
        sma_score += 5
        sma_details.append("Price is testing above 20 SMA.")
    else:
        sma_score -= 5
        sma_details.append("Price is below 20 SMA.")

    sma_score = max(-35, min(35, sma_score))
    sma_signal = "Bullish" if sma_score > 10 else ("Bearish" if sma_score < -10 else "Neutral")

    # 2. Evaluate RSI (Weight: ~30%)
    rsi_score = 0
    rsi_details = []
    
    if rsi < 30:
        rsi_score = 30
        rsi_details.append(f"RSI is {rsi:.1f} (Oversold territory < 30). High probability of bullish mean-reversion.")
        rsi_signal = "Bullish (Oversold)"
    elif rsi > 70:
        rsi_score = -30
        rsi_details.append(f"RSI is {rsi:.1f} (Overbought territory > 70). High risk of pullback or consolidation.")
        rsi_signal = "Bearish (Overbought)"
    elif 50 <= rsi <= 70:
        # Healthy bullish momentum
        rsi_score = int((rsi - 50) / 20 * 20)
        rsi_details.append(f"RSI is {rsi:.1f} displaying constructive upward momentum.")
        rsi_signal = "Bullish"
    else: # 30 <= rsi < 50
        # Bearish momentum
        rsi_score = -int((50 - rsi) / 20 * 20)
        rsi_details.append(f"RSI is {rsi:.1f} showing sluggish downward pressure.")
        rsi_signal = "Bearish"

    # 3. Evaluate MACD (Weight: ~35%)
    macd_score = 0
    macd_details = []
    
    # Crossover check
    if prev_macd <= prev_signal and macd > signal:
        macd_score += 35
        macd_details.append(f"Bullish MACD crossover: MACD line ({macd:.3f}) crossed above Signal ({signal:.3f}).")
    elif prev_macd >= prev_signal and macd < signal:
        macd_score -= 35
        macd_details.append(f"Bearish MACD crossover: MACD line ({macd:.3f}) crossed below Signal ({signal:.3f}).")
    elif macd > signal:
        macd_score += 20
        macd_details.append(f"MACD line ({macd:.3f}) is trending above Signal line ({signal:.3f}).")
    else:
        macd_score -= 20
        macd_details.append(f"MACD line ({macd:.3f}) is trending below Signal line ({signal:.3f}).")
        
    if hist > 0:
        macd_score += 15
        macd_details.append("MACD histogram is positive, confirming positive momentum.")
    else:
        macd_score -= 15
        macd_details.append("MACD histogram is negative, indicating bearish momentum.")

    macd_score = max(-35, min(35, macd_score))
    macd_signal_label = "Bullish" if macd_score > 10 else ("Bearish" if macd_score < -10 else "Neutral")

    # Aggregate Total Score (-100 to +100)
    total_score = sma_score + rsi_score + macd_score
    total_score = max(-100, min(100, total_score))

    if total_score >= 50:
        verdict = "STRONG BUY"
        sentiment = "Strongly Bullish"
    elif total_score >= 20:
        verdict = "BUY"
        sentiment = "Bullish"
    elif total_score <= -50:
        verdict = "STRONG SELL"
        sentiment = "Strongly Bearish"
    elif total_score <= -20:
        verdict = "SELL"
        sentiment = "Bearish"
    else:
        verdict = "HOLD"
        sentiment = "Neutral"

    # Summary synthesis
    summary_parts = []
    if verdict in ["STRONG BUY", "BUY"]:
        summary_parts.append(f"Technical setup is {sentiment.lower()} (Score: {total_score}/100).")
    elif verdict in ["STRONG SELL", "SELL"]:
        summary_parts.append(f"Technical indicators flash caution with a {sentiment.lower()} outlook (Score: {total_score}/100).")
    else:
        summary_parts.append(f"Indicators are mixed, suggesting consolidation or range-bound action (Score: {total_score}/100).")
        
    summary_parts.append(" ".join(sma_details[:1] + rsi_details[:1] + macd_details[:1]))
    summary = " ".join(summary_parts)

    return {
        "verdict": verdict,
        "score": total_score,
        "sentiment": sentiment,
        "summary": summary,
        "breakdown": {
            "sma": {
                "signal": sma_signal,
                "score": sma_score,
                "weight": 35,
                "details": " ".join(sma_details),
                "sma_20": sma_20,
                "sma_50": sma_50
            },
            "rsi": {
                "signal": rsi_signal,
                "score": rsi_score,
                "weight": 30,
                "value": rsi,
                "details": " ".join(rsi_details)
            },
            "macd": {
                "signal": macd_signal_label,
                "score": macd_score,
                "weight": 35,
                "details": " ".join(macd_details),
                "macd": macd,
                "signal_line": signal,
                "hist": hist
            }
        }
    }
