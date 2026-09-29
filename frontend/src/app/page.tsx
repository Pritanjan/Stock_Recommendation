"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { StockOverview } from "@/components/StockOverview";
import { SignalBreakdownPanel } from "@/components/SignalBreakdownPanel";
import { WatchlistTable } from "@/components/WatchlistTable";
import { StockAnalysisResponse, WatchlistItem } from "@/types/stock";
import { AlertCircle, RefreshCw } from "lucide-react";

const CandlestickChart = dynamic(
  () => import("@/components/CandlestickChart").then((mod) => mod.CandlestickChart),
  { ssr: false }
);

import { BACKEND_URL, WS_URL } from "@/config/api";

export default function Dashboard() {
  const [symbol, setSymbol] = useState<string>("RELIANCE.NS");
  const [period, setPeriod] = useState<string>("6mo");
  const [analysis, setAnalysis] = useState<StockAnalysisResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isSimulateMode, setIsSimulateMode] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState<{ is_open: boolean; status: string; message: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial market status
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stocks/market-status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMarketStatus(data);
      })
      .catch((err) => console.error("Market status fetch error:", err));
  }, []);

  // Fetch full analysis for selected symbol
  const fetchStockAnalysis = useCallback(
    async (sym: string, per: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/stocks/${sym}/history?period=${per}&interval=1d`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch data for ${sym} (Status ${res.status})`);
        }
        const data: StockAnalysisResponse = await res.json();
        setAnalysis(data);
      } catch (err: any) {
        console.error("Error fetching analysis:", err);
        setError(err.message || "Failed to load stock data");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch Watchlist table batch
  const fetchWatchlist = useCallback(async () => {
    setIsWatchlistLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stocks/watchlist`);
      if (res.ok) {
        const data: WatchlistItem[] = await res.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error("Error fetching watchlist:", err);
    } finally {
      setIsWatchlistLoading(false);
    }
  }, []);

  // Initial load and symbol/period change handler
  useEffect(() => {
    fetchStockAnalysis(symbol, period);
  }, [symbol, period, fetchStockAnalysis]);

  useEffect(() => {
    fetchWatchlist();
    // Periodic refresh for watchlist every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000);
    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  // WebSocket connection for real-time live ticker ticks (respects market hours & simulation toggle)
  useEffect(() => {
    if (!symbol) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`${WS_URL}/api/stocks/ws/${symbol}?simulate=${isSimulateMode}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.market_status) {
            setMarketStatus({
              is_open: payload.market_status === "OPEN",
              status: payload.market_status,
              message: payload.market_message || "",
            });
          }

          if (payload.type === "TICK" && payload.symbol === symbol) {
            setAnalysis((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                quote: {
                  ...prev.quote,
                  price: payload.price,
                  change: payload.change,
                  change_percent: payload.change_percent,
                  day_high: Math.max(prev.quote.day_high, payload.price),
                  day_low: Math.min(prev.quote.day_low, payload.price),
                  last_updated: Math.floor(payload.timestamp),
                },
              };
            });
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
      };

      ws.onerror = () => {
        setIsWsConnected(false);
      };
    } catch (e) {
      setIsWsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, isSimulateMode]);

  const handleSelectSymbol = (newSymbol: string) => {
    setSymbol(newSymbol);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = () => {
    fetchStockAnalysis(symbol, period);
    fetchWatchlist();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Header
        currentSymbol={symbol}
        onSelectSymbol={handleSelectSymbol}
        onRefresh={handleRefresh}
        isLoading={isLoading || isWatchlistLoading}
        isWsConnected={isWsConnected}
        lastUpdated={analysis?.quote.last_updated}
        marketStatus={marketStatus}
        isSimulateMode={isSimulateMode}
        onToggleSimulate={() => setIsSimulateMode((prev) => !prev)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Error Alert Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-rose-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={handleRefresh}
              className="ml-auto rounded-lg bg-rose-900/60 px-3 py-1 text-xs font-semibold hover:bg-rose-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Selected Stock Hero Overview */}
        {analysis?.quote ? (
          <StockOverview quote={analysis.quote} />
        ) : isLoading ? (
          <div className="h-36 rounded-2xl border border-gray-800 bg-gray-900/40 animate-pulse flex items-center justify-center">
            <span className="text-gray-500 text-sm font-medium">Fetching real-time stock quote...</span>
          </div>
        ) : null}

        {/* Main Workspace Grid: Candlestick Chart + Signal Breakdown Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Candlestick Chart (7 or 8 columns on large screens) */}
          <div className="lg:col-span-7 xl:col-span-8">
            {analysis?.chart_data ? (
              <CandlestickChart
                data={analysis.chart_data}
                period={period}
                onPeriodChange={setPeriod}
                symbol={symbol}
              />
            ) : (
              <div className="h-[460px] rounded-2xl border border-gray-800 bg-[#0d1322] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent" />
                  <p className="text-gray-400 text-xs">Loading chart data and indicators...</p>
                </div>
              </div>
            )}
          </div>

          {/* Signal Breakdown Panel (5 or 4 columns on large screens) */}
          <div className="lg:col-span-5 xl:col-span-4">
            {analysis?.recommendation ? (
              <SignalBreakdownPanel
                recommendation={analysis.recommendation}
                symbol={symbol}
              />
            ) : (
              <div className="h-[460px] rounded-2xl border border-gray-800 bg-[#0d1322] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent" />
                  <p className="text-gray-400 text-xs">Computing technical signal matrix...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="pt-2">
          <WatchlistTable
            items={watchlist}
            currentSymbol={symbol}
            onSelectSymbol={handleSelectSymbol}
            isLoading={isWatchlistLoading}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-[#0b0f19] py-4 px-6 text-center text-xs text-gray-500">
        <p>
          AlphaPulse India • Real-time NSE & BSE technical analysis powered by 20/50 SMA, RSI (14), and MACD algorithms. For educational & illustrative purposes only.
        </p>
      </footer>
    </div>
  );
}
