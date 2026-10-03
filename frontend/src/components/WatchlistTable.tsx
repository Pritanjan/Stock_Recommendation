"use client";

import React, { useState } from "react";
import { WatchlistItem } from "@/types/stock";
import { TrendingUp, TrendingDown, ChevronRight, Filter, Search } from "lucide-react";

interface WatchlistTableProps {
  items: WatchlistItem[];
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
}

const SECTOR_TABS = [
  "ALL",
  "NIFTY 50",
  "Banking",
  "Finance",
  "IT & Tech",
  "Auto",
  "Energy",
  "Consumer",
  "Pharma",
  "Metals",
  "Infra",
  "Defence"
] as const;

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  items,
  currentSymbol,
  onSelectSymbol,
  isLoading,
}) => {
  const [filterText, setFilterText] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [signalFilter, setSignalFilter] = useState<"ALL" | "BUY" | "HOLD" | "SELL">("ALL");
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  const filteredItems = items.filter((item) => {
    // Sector filter
    if (selectedSector === "NIFTY 50" && !item.is_nifty50) return false;
    if (selectedSector !== "ALL" && selectedSector !== "NIFTY 50" && item.sector !== selectedSector) {
      return false;
    }

    const matchesSearch =
      item.symbol.toLowerCase().includes(filterText.toLowerCase()) ||
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.sector && item.sector.toLowerCase().includes(filterText.toLowerCase()));

    if (!matchesSearch) return false;

    if (signalFilter === "BUY") {
      return item.recommendation.includes("BUY");
    }
    if (signalFilter === "SELL") {
      return item.recommendation.includes("SELL");
    }
    if (signalFilter === "HOLD") {
      return item.recommendation === "HOLD";
    }

    return true;
  });

  const displayedItems = displayLimit === -1 ? filteredItems : filteredItems.slice(0, displayLimit);

  const getVerdictBadge = (verdict: string) => {
    if (verdict === "STRONG BUY") {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
    if (verdict === "BUY") {
      return "bg-emerald-950/60 text-emerald-400 border-emerald-600/40";
    }
    if (verdict === "STRONG SELL") {
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
    if (verdict === "SELL") {
      return "bg-rose-950/60 text-rose-400 border-rose-600/40";
    }
    return "bg-amber-950/60 text-amber-400 border-amber-600/40";
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#0d1322] p-5 shadow-xl space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              Indian Market Watchlist & Signal Radar
            </h3>
            <span className="rounded-full bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
              {items.length} Indian Equities
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Real-time scanner across all NIFTY 50 and top Indian market leaders with SMA, RSI, and MACD indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Indian stocks or sector..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="rounded-lg bg-gray-900 border border-gray-800 pl-8 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          {/* Signal Filter Pills */}
          <div className="flex items-center rounded-lg bg-gray-900 border border-gray-800 p-0.5 text-xs">
            {(["ALL", "BUY", "HOLD", "SELL"] as const).map((sig) => (
              <button
                key={sig}
                onClick={() => setSignalFilter(sig)}
                className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                  signalFilter === sig
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-gray-800/60 text-xs">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
          Sector:
        </span>
        {SECTOR_TABS.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedSector === sec
                ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                : "bg-gray-900/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>


      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/60 text-gray-400 uppercase font-semibold border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">24h Change</th>
              <th className="py-3 px-4">SMA 20 / 50</th>
              <th className="py-3 px-4">RSI (14)</th>
              <th className="py-3 px-4">MACD Signal</th>
              <th className="py-3 px-4">Recommendation</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent mr-2" />
                  Loading market quotes and computing technical signals...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No stocks match the selected filter.
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                const isSelected = item.symbol === currentSymbol;
                const isPositive = item.change >= 0;

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cyan-950/30 border-l-4 border-l-cyan-400"
                        : "hover:bg-gray-900/50"
                    }`}
                  >
                    {/* Symbol, Name & Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm">{item.symbol.replace(".NS", "").replace(".BO", "")}</span>
                          <span className="rounded bg-cyan-950/70 border border-cyan-800/40 px-1 py-0.2 text-[9px] font-semibold text-cyan-400">
                            {item.symbol.includes(".BO") ? "BSE" : "NSE"}
                          </span>
                          {item.is_nifty50 && (
                            <span className="rounded bg-blue-950/70 border border-blue-700/50 px-1 py-0.2 text-[9px] font-bold text-blue-300">
                              NIFTY 50
                            </span>
                          )}
                          {item.sector && (
                            <span className="rounded bg-gray-800/80 px-1.5 py-0.2 text-[9px] text-gray-300">
                              {item.sector}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-white font-mono text-sm">
                      ₹{item.price.toFixed(2)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3.5 px-4 font-mono">
                      <div
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {item.change_percent.toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* SMA 20 / 50 */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400">₹{item.sma_20?.toFixed(1) || "-"}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-amber-400">₹{item.sma_50?.toFixed(1) || "-"}</span>
                      </div>
                    </td>

                    {/* RSI */}
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          (item.rsi || 50) < 30
                            ? "bg-emerald-500/10 text-emerald-400"
                            : (item.rsi || 50) > 70
                            ? "bg-rose-500/10 text-rose-400"
                            : "text-purple-400"
                        }`}
                      >
                        {item.rsi?.toFixed(1) || "-"}
                      </span>
                    </td>

                    {/* MACD Signal */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-semibold ${
                          String(item.macd_signal || "").toLowerCase().includes("bullish")
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {String(item.macd_signal || "Neutral")}
                      </span>
                    </td>

                    {/* Recommendation */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${getVerdictBadge(
                          item.recommendation
                        )}`}
                      >
                        {item.recommendation}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSymbol(item.symbol);
                        }}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-all ${
                          isSelected
                            ? "bg-cyan-500 text-gray-900"
                            : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40"
                        }`}
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination / Item Count Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800/60 text-xs text-gray-400">
        <div>
          Showing <span className="font-bold text-white">{displayedItems.length}</span> of{" "}
          <span className="font-bold text-white">{filteredItems.length}</span> matching stocks (Total monitored:{" "}
          <span className="font-bold text-cyan-400">{items.length}</span>)
        </div>
        <div className="flex items-center gap-2">
          {displayLimit !== -1 && displayedItems.length < filteredItems.length && (
            <button
              onClick={() => setDisplayLimit((prev) => prev + 25)}
              className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700/60 rounded-lg transition-colors font-medium text-xs"
            >
              Load More (+25)
            </button>
          )}
          <button
            onClick={() => setDisplayLimit(displayLimit === -1 ? 20 : -1)}
            className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 rounded-lg transition-colors font-medium text-xs"
          >
            {displayLimit === -1 ? "Show Top 20" : "View All"}
          </button>
        </div>
      </div>

    </div>
  );
};
