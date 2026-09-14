# AlphaPulse | Real-Time Stock Analytics & Technical Signals Dashboard

A full-stack financial dashboard designed to analyze real-time market data, calculate core technical indicators (**20/50 SMA**, **RSI (14)**, and **MACD (12, 26, 9)**), output rule-based trading recommendations (**Strong Buy, Buy, Hold, Sell, Strong Sell**), and display interactive candlestick charts with real-time streaming updates.

---

## 🌟 Key Features

1. **FastAPI Backend**:
   - **Market Data Retrieval**: Direct connection to Yahoo Finance (`yfinance`) with in-memory caching to avoid rate-limiting.
   - **Mathematical Indicators**:
     - **SMA 20 & SMA 50**: Moving average trend channels with golden/death cross detection.
     - **RSI (14)**: Wilder's smoothed momentum oscillator identifying overbought (>70) and oversold (<30) conditions.
     - **MACD (12, 26, 9)**: Moving Average Convergence Divergence line, 9-period Signal line, and momentum Histogram.
   - **Rule-Based Recommendation Engine**: Synthesizes moving average crosses, price-to-SMA positioning, RSI momentum, and MACD divergence into an aggregated score (-100 to +100) and actionable verdict (`STRONG BUY`, `BUY`, `HOLD`, `SELL`, `STRONG SELL`).
   - **Real-Time WebSockets**: Live streaming simulated ticks (`/api/stocks/ws/{symbol}`) powering price pulse animations.

2. **Next.js & Tailwind CSS Frontend**:
   - **TradingView Lightweight Charts**: Smooth 60fps canvas-rendered candlestick charts with volume bars.
   - **Interactive Overlays**: Toggleable SMA 20 (Cyan) and SMA 50 (Amber) lines.
   - **Technical Indicator Sub-panels**: Dedicated views for RSI (14) (with 70/30 bands) and MACD (line, signal, histogram).
   - **Signal Breakdown Panel**: Displays the algorithmic score meter, per-indicator contribution cards, and plain-English narrative explanation.
   - **Market Watchlist Table**: Real-time scanner table featuring price change badges, indicator summaries, filter pills (`ALL`, `BUY`, `HOLD`, `SELL`), and instant row selection.

---

## 🏗️ Project Architecture

```
.
├── backend/
│   ├── .venv/                      # Python Virtual Environment
│   ├── main.py                     # FastAPI server with CORS & WebSocket routing
│   ├── requirements.txt            # FastAPI, yfinance, pandas, numpy, uvicorn
│   ├── routers/
│   │   └── stocks.py               # REST API & WebSocket endpoints
│   ├── services/
│   │   ├── indicators.py           # SMA 20/50, RSI 14, MACD calculations
│   │   ├── recommender.py          # Rule-based decision matrix & narrative synthesis
│   │   └── stock_service.py        # yfinance integration & caching
│   └── test_backend.py             # Automated backend verification test suite
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Dark theme & financial animations
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Main dashboard coordinator & WS client
│   │   ├── components/
│   │   │   ├── CandlestickChart.tsx# Lightweight Charts integration
│   │   │   ├── Header.tsx          # Symbol search, presets, live feed status
│   │   │   ├── SignalBreakdownPanel.tsx # Recommendation verdict & score gauge
│   │   │   ├── StockOverview.tsx   # Hero price card with day range bar
│   │   │   └── WatchlistTable.tsx  # Interactive scanner table with filter tabs
│   │   └── types/
│   │       └── stock.ts            # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── start-backend.ps1               # Automated backend launch script
├── start-frontend.ps1              # Automated frontend launch script
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1. Run the Backend (FastAPI)
Open a terminal in the root directory and execute:
```powershell
.\start-backend.ps1
```
*Or manually:*
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Run the Frontend (Next.js)
Open a second terminal in the root directory and execute:
```powershell
.\start-frontend.ps1
```
*Or manually:*
```powershell
cd frontend
npm run dev
```
- Dashboard UI: `http://localhost:3000`

---

## 📊 Indicator & Recommendation Methodology

| Indicator | Bullish Signals | Bearish Signals | Weight |
|---|---|---|---|
| **SMA 20 / 50** | Golden Cross (SMA 20 > 50), Price > SMA 20 & 50 | Death Cross (SMA 20 < 50), Price < SMA 20 & 50 | 35% |
| **RSI (14)** | Oversold (< 30, reversal opportunity), 50–70 positive momentum | Overbought (> 70, consolidation risk), < 50 downward drag | 30% |
| **MACD (12, 26, 9)** | Bullish Crossover (MACD > Signal), Positive Expanding Histogram | Bearish Crossover (MACD < Signal), Negative Histogram | 35% |

**Score Synthesis**:
- `+50 to +100`: **STRONG BUY**
- `+20 to +49`: **BUY**
- `-19 to +19`: **HOLD**
- `-20 to -49`: **SELL**
- `-50 to -100`: **STRONG SELL**
