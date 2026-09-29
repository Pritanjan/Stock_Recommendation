"use client";

import React from "react";
import { Recommendation } from "@/types/stock";
import { ShieldCheck, TrendingUp, TrendingDown, Minus, Info, Award } from "lucide-react";

interface SignalBreakdownPanelProps {
  recommendation: Recommendation;
  symbol: string;
}

export const SignalBreakdownPanel: React.FC<SignalBreakdownPanelProps> = ({
  recommendation,
  symbol,
}) => {
  const { verdict, score, sentiment, summary, breakdown } = recommendation;

  const getVerdictBadge = () => {
    switch (verdict) {
      case "STRONG BUY":
        return {
          bg: "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/20",
          icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
          accent: "text-emerald-400",
        };
      case "BUY":
        return {
          bg: "bg-emerald-950/70 border-emerald-600/70 text-emerald-300 shadow-emerald-600/10",
          icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
          accent: "text-emerald-400",
        };
      case "STRONG SELL":
        return {
          bg: "bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-500/20",
          icon: <TrendingDown className="h-5 w-5 text-rose-400" />,
          accent: "text-rose-400",
        };
      case "SELL":
        return {
          bg: "bg-rose-950/70 border-rose-600/70 text-rose-300 shadow-rose-600/10",
          icon: <TrendingDown className="h-5 w-5 text-rose-400" />,
          accent: "text-rose-400",
        };
      default: // HOLD
        return {
          bg: "bg-amber-950/70 border-amber-600/70 text-amber-300 shadow-amber-600/10",
          icon: <Minus className="h-5 w-5 text-amber-400" />,
          accent: "text-amber-400",
        };
    }
  };

  const badgeStyle = getVerdictBadge();

  // Normalize score (-100 to 100) to 0% - 100% for progress gauge
  const scorePercent = Math.min(100, Math.max(0, ((score + 100) / 200) * 100));

  const getIndicatorBadge = (signal: any) => {
    const s = String(signal || "").toLowerCase();
    if (s.includes("bullish")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (s.includes("bearish")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#0d1322] p-5 shadow-xl space-y-6">
      {/* Top Header: Verdict & Overall Score */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Rule-Based Technical Verdict
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Algorithmic signal synthesis for <span className="font-semibold text-gray-200">{symbol}</span>
          </p>
        </div>

        {/* Verdict Badge */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border shadow-lg font-black tracking-wider text-sm ${badgeStyle.bg}`}
        >
          {badgeStyle.icon}
          <span>{verdict}</span>
        </div>
      </div>

      {/* Score Meter / Sentiment Gauge */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-400">Composite Signal Score</span>
          <span className={`font-mono text-sm ${badgeStyle.accent}`}>
            {score > 0 ? `+${score}` : score} / 100 ({sentiment})
          </span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-gray-800 overflow-hidden">
          {/* Background color gradient for the spectrum */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 opacity-30" />
          {/* Marker pointer */}
          <div
            className="absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full bg-white shadow-md shadow-cyan-500 transition-all duration-700"
            style={{ left: `${scorePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 font-medium px-1">
          <span>Strong Sell (-100)</span>
          <span>Neutral (0)</span>
          <span>Strong Buy (+100)</span>
        </div>
      </div>

      {/* Indicator Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. SMA Card */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              20 / 50 SMA Trend
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${getIndicatorBadge(
                breakdown.sma.signal
              )}`}
            >
              {breakdown.sma.signal}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/50">
              <span className="text-gray-500 block text-[10px]">SMA 20</span>
              <span className="text-cyan-400 font-bold">₹{breakdown.sma.sma_20?.toFixed(2) || "N/A"}</span>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/50">
              <span className="text-gray-500 block text-[10px]">SMA 50</span>
              <span className="text-amber-400 font-bold">₹{breakdown.sma.sma_50?.toFixed(2) || "N/A"}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">{breakdown.sma.details}</p>
        </div>

        {/* 2. RSI Card */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              RSI (14) Momentum
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${getIndicatorBadge(
                breakdown.rsi.signal
              )}`}
            >
              {breakdown.rsi.signal}
            </span>
          </div>

          <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/50 text-xs font-mono py-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-[10px]">RSI Value</span>
              <span className="text-purple-400 font-bold text-sm">
                {breakdown.rsi.value?.toFixed(2) || "N/A"}
              </span>
            </div>
            {/* Mini RSI range bar */}
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden relative">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, breakdown.rsi.value || 50))}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">{breakdown.rsi.details}</p>
        </div>

        {/* 3. MACD Card */}
        <div className="rounded-xl border border-gray-800/80 bg-gray-900/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              MACD (12, 26, 9)
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${getIndicatorBadge(
                breakdown.macd.signal
              )}`}
            >
              {typeof breakdown.macd.signal === "string" ? breakdown.macd.signal : "Neutral"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono py-1">
            <div className="bg-gray-950/60 p-1.5 rounded border border-gray-800/50">
              <span className="text-gray-500 block text-[9px]">MACD</span>
              <span className="text-cyan-400 font-bold text-[11px]">
                {breakdown.macd.macd?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="bg-gray-950/60 p-1.5 rounded border border-gray-800/50">
              <span className="text-gray-500 block text-[9px]">SIGNAL</span>
              <span className="text-orange-400 font-bold text-[11px]">
                {breakdown.macd.signal_line !== undefined && breakdown.macd.signal_line !== null
                  ? Number(breakdown.macd.signal_line).toFixed(2)
                  : breakdown.macd.signal_val !== undefined && breakdown.macd.signal_val !== null
                  ? Number(breakdown.macd.signal_val).toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="bg-gray-950/60 p-1.5 rounded border border-gray-800/50">
              <span className="text-gray-500 block text-[9px]">HIST</span>
              <span
                className={`font-bold text-[11px] ${
                  (breakdown.macd.hist || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {breakdown.macd.hist?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">{breakdown.macd.details}</p>
        </div>
      </div>

      {/* Narrative Synthesis Rationale Box */}
      <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3.5 flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Algorithmic Rationale & Market Context
          </span>
          <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};
