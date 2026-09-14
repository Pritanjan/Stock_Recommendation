"use client";

import React, { useState } from "react";
import { Search, RefreshCw, Activity, Zap, TrendingUp } from "lucide-react";

interface HeaderProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isWsConnected: boolean;
  lastUpdated?: number;
  marketStatus?: { is_open: boolean; status: string; message: string } | null;
  isSimulateMode?: boolean;
  onToggleSimulate?: () => void;
}

const POPULAR_TICKERS = [
  { label: "RELIANCE", symbol: "RELIANCE.NS" },
  { label: "TCS", symbol: "TCS.NS" },
  { label: "HDFC BANK", symbol: "HDFCBANK.NS" },
  { label: "INFOSYS", symbol: "INFY.NS" },
  { label: "LIC", symbol: "LICI.NS" },
  { label: "ICICI BANK", symbol: "ICICIBANK.NS" },
  { label: "SBI", symbol: "SBIN.NS" },
  { label: "BHARTI AIRTEL", symbol: "BHARTIARTL.NS" },
  { label: "TATA MOTORS", symbol: "TMCV.NS" },
  { label: "ITC", symbol: "ITC.NS" },
  { label: "L&T", symbol: "LT.NS" },
  { label: "NIFTY 50", symbol: "^NSEI" },
];

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  onRefresh,
  isLoading,
  isWsConnected,
  lastUpdated,
  marketStatus,
  isSimulateMode,
  onToggleSimulate,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Debounced search suggestions
  React.useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${backendUrl}/api/stocks/search?q=${encodeURIComponent(searchInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside to dismiss suggestions
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput("");
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (sym: string) => {
    onSelectSymbol(sym);
    setSearchInput("");
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-[#0b0f19]/90 backdrop-blur-md px-4 py-3 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Alpha<span className="text-cyan-400">Pulse</span>
              </h1>
              <span className="rounded-full bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                India (NSE/BSE)
              </span>
            </div>
            <p className="text-xs text-gray-400">Indian Markets Real-Time Technical Signals & Candlestick Analysis</p>
          </div>
        </div>

        {/* Search Bar & Auto-Complete Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-0 md:mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Indian stock (e.g. LIC, RELIANCE, TCS, INFY)..."
                value={searchInput}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl bg-gray-900/90 border border-gray-800 pl-9 pr-20 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
              >
                Go
              </button>
            </div>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-gray-800 bg-[#0e1424] shadow-2xl z-50 overflow-hidden backdrop-blur-md max-h-64 overflow-y-auto divide-y divide-gray-800/60">
              {suggestions.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelectSuggestion(item.symbol)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-cyan-950/40 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {item.symbol.replace(".NS", "").replace(".BO", "")}
                    </span>
                    <span className="text-xs text-gray-400 truncate max-w-[240px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="rounded bg-gray-800 group-hover:bg-cyan-900/50 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                    {item.symbol.includes(".BO") ? "BSE" : "NSE"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Status Indicator, Market State & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Market Open/Closed Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border ${
              marketStatus?.is_open
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                : "bg-rose-950/60 text-rose-400 border-rose-800/50"
            }`}
            title={marketStatus?.message || "NSE/BSE Trading Hours: 09:15 AM - 03:30 PM IST"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                marketStatus?.is_open ? "bg-emerald-400 animate-ping" : "bg-rose-500"
              }`}
            />
            <span>{marketStatus?.is_open ? "Market Open" : "Market Closed"}</span>
          </div>

          {/* Real-Time WebSocket Feed Status */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-900/80 border border-gray-800 px-2.5 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isWsConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="text-gray-300 text-[11px] font-medium flex items-center gap-1">
              <Zap className="h-3 w-3 text-cyan-400" />
              {isWsConnected ? "Live WS" : "Offline"}
            </span>
          </div>

          {/* Demo Tick Simulation Toggle (Default: OFF) */}
          {onToggleSimulate && (
            <button
              onClick={onToggleSimulate}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                isSimulateMode
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-gray-900/80 text-gray-400 border-gray-800 hover:text-gray-200"
              }`}
              title="Toggle simulated price ticks for off-market testing"
            >
              ⚡ Sim: {isSimulateMode ? "ON" : "OFF"}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Quotes"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Ticker Chips */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-medium text-gray-500 mr-1 flex items-center gap-1">
          <Activity className="h-3 w-3" /> Quick:
        </span>
        {POPULAR_TICKERS.map((item) => {
          const isActive = item.symbol === currentSymbol;
          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/10"
                  : "bg-gray-900/80 text-gray-400 border border-gray-800/80 hover:border-gray-700 hover:text-gray-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
