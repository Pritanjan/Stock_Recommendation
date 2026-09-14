"use client";

import React, { useEffect, useState, useRef } from "react";
import { StockQuote } from "@/types/stock";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Calendar } from "lucide-react";

interface StockOverviewProps {
  quote: StockQuote;
}

export const StockOverview: React.FC<StockOverviewProps> = ({ quote }) => {
  const [flashClass, setFlashClass] = useState<string>("");
  const prevPriceRef = useRef<number>(quote.price);

  useEffect(() => {
    if (prevPriceRef.current !== quote.price) {
      if (quote.price > prevPriceRef.current) {
        setFlashClass("flash-up");
      } else {
        setFlashClass("flash-down");
      }
      prevPriceRef.current = quote.price;

      const timer = setTimeout(() => {
        setFlashClass("");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [quote.price]);

  const isPositive = quote.change >= 0;

  // Day range calculation percentage
  const dayRangeSpread = quote.day_high - quote.day_low;
  const dayRangePos = dayRangeSpread > 0
    ? Math.min(100, Math.max(0, ((quote.price - quote.day_low) / dayRangeSpread) * 100))
    : 50;

  const formatMarketCap = (cap?: number | null) => {
    if (!cap) return "N/A";
    if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(2)} Cr`;
    if (cap >= 1e5) return `₹${(cap / 1e5).toFixed(2)} Lakh`;
    return `₹${cap.toLocaleString("en-IN")}`;
  };

  return (
    <div className={`rounded-2xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-sm transition-all duration-300 ${flashClass}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        {/* Symbol & Name */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black tracking-tight text-white">{quote.symbol}</span>
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300">
              {quote.currency || "INR"}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-400 truncate max-w-xs">{quote.name}</p>
        </div>

        {/* Current Price & Change */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price (NSE)</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              ₹{quote.price.toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>
                {isPositive ? "+" : "-"}₹{Math.abs(quote.change).toFixed(2)} ({isPositive ? "+" : ""}
                {quote.change_percent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Day Range Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>Day Low: <strong className="text-gray-200">₹{quote.day_low.toFixed(2)}</strong></span>
            <span>Day High: <strong className="text-gray-200">₹{quote.day_high.toFixed(2)}</strong></span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${dayRangePos}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 text-center">
            Day Range Positioning ({dayRangePos.toFixed(0)}%)
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs border-t md:border-t-0 md:border-l border-gray-800 pt-3 md:pt-0 md:pl-6 font-mono">
          <div>
            <span className="text-gray-500 block font-sans">52W Range</span>
            <span className="font-semibold text-gray-200">
              ₹{quote.year_low.toFixed(2)} - ₹{quote.year_high.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Volume</span>
            <span className="font-semibold text-gray-200">
              {quote.volume ? quote.volume.toLocaleString() : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Market Cap</span>
            <span className="font-semibold text-gray-200">{formatMarketCap(quote.market_cap)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">P/E Ratio</span>
            <span className="font-semibold text-gray-200">
              {quote.pe_ratio ? quote.pe_ratio.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
