"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChartData } from "@/types/stock";
import { Sliders, Eye, EyeOff, BarChart, Layers } from "lucide-react";

interface CandlestickChartProps {
  data: ChartData;
  period: string;
  onPeriodChange: (period: string) => void;
  symbol: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  period,
  onPeriodChange,
  symbol,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "rsi" | "macd">("overview");

  const PERIODS = [
    { label: "1D", value: "1d" },
    { label: "5D", value: "5d" },
    { label: "1M", value: "1mo" },
    { label: "6M", value: "6mo" },
    { label: "1Y", value: "1y" },
  ];

  // Primary Candlestick & SMA Chart
  useEffect(() => {
    if (!chartContainerRef.current || !data.candlesticks.length) return;

    let chart: any = null;
    let isCancelled = false;

    import("lightweight-charts").then(({ createChart, ColorType, CrosshairMode }) => {
      if (isCancelled || !chartContainerRef.current) return;

      chartContainerRef.current.innerHTML = "";

      chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 420,
        layout: {
          background: { type: ColorType.Solid, color: "#0d1322" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(30, 41, 59, 0.5)" },
          horzLines: { color: "rgba(30, 41, 59, 0.5)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: "#1e293b",
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
        timeScale: {
          borderColor: "#1e293b",
          timeVisible: period === "1d" || period === "5d",
          secondsVisible: false,
        },
      });

      // Candlestick Series
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });

      candleSeries.setData(data.candlesticks);

      // Volume Series
      if (data.volume.length) {
        const volumeSeries = chart.addHistogramSeries({
          color: "#26a69a",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "", // Overlay on separate internal scale
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        volumeSeries.setData(data.volume);
      }

      // SMA 20 Overlay (Cyan)
      if (showSma20 && data.sma_20.length) {
        const sma20Series = chart.addLineSeries({
          color: "#38bdf8",
          lineWidth: 2,
          title: "SMA 20",
        });
        sma20Series.setData(data.sma_20);
      }

      // SMA 50 Overlay (Amber)
      if (showSma50 && data.sma_50.length) {
        const sma50Series = chart.addLineSeries({
          color: "#f59e0b",
          lineWidth: 2,
          title: "SMA 50",
        });
        sma50Series.setData(data.sma_50);
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) {
          chart.remove();
        }
      };
    });

    return () => {
      isCancelled = true;
      if (chart) {
        chart.remove();
      }
    };
  }, [data.candlesticks, data.volume, data.sma_20, data.sma_50, showSma20, showSma50, period]);

  // RSI Subchart
  useEffect(() => {
    if (activeTab !== "rsi" || !rsiContainerRef.current || !data.rsi.length) return;

    let chart: any = null;
    let isCancelled = false;

    import("lightweight-charts").then(({ createChart, ColorType, LineStyle }) => {
      if (isCancelled || !rsiContainerRef.current) return;

      rsiContainerRef.current.innerHTML = "";

      chart = createChart(rsiContainerRef.current, {
        width: rsiContainerRef.current.clientWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: "#0d1322" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(30, 41, 59, 0.4)" },
          horzLines: { color: "rgba(30, 41, 59, 0.4)" },
        },
        rightPriceScale: {
          borderColor: "#1e293b",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: "#1e293b",
          visible: true,
        },
      });

      const rsiSeries = chart.addLineSeries({
        color: "#a855f7",
        lineWidth: 2,
        title: "RSI 14",
      });
      rsiSeries.setData(data.rsi);

      // Overbought (70) and Oversold (30) reference lines
      rsiSeries.createPriceLine({
        price: 70,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Overbought (70)",
      });

      rsiSeries.createPriceLine({
        price: 30,
        color: "#10b981",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Oversold (30)",
      });

      rsiSeries.createPriceLine({
        price: 50,
        color: "#64748b",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false,
        title: "Neutral (50)",
      });

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (rsiContainerRef.current && chart) {
          chart.applyOptions({ width: rsiContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) chart.remove();
      };
    });

    return () => {
      isCancelled = true;
      if (chart) chart.remove();
    };
  }, [activeTab, data.rsi]);

  // MACD Subchart
  useEffect(() => {
    if (activeTab !== "macd" || !macdContainerRef.current || !data.macd.length) return;

    let chart: any = null;
    let isCancelled = false;

    import("lightweight-charts").then(({ createChart, ColorType }) => {
      if (isCancelled || !macdContainerRef.current) return;

      macdContainerRef.current.innerHTML = "";

      chart = createChart(macdContainerRef.current, {
        width: macdContainerRef.current.clientWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: "#0d1322" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(30, 41, 59, 0.4)" },
          horzLines: { color: "rgba(30, 41, 59, 0.4)" },
        },
        rightPriceScale: {
          borderColor: "#1e293b",
        },
        timeScale: {
          borderColor: "#1e293b",
          visible: true,
        },
      });

      // Histogram
      const histSeries = chart.addHistogramSeries({
        title: "Histogram",
      });
      histSeries.setData(
        data.macd.map((item) => ({
          time: item.time,
          value: item.hist,
          color: item.hist >= 0 ? "#10b98188" : "#ef444488",
        }))
      );

      // MACD Line (Blue)
      const macdLineSeries = chart.addLineSeries({
        color: "#38bdf8",
        lineWidth: 2,
        title: "MACD",
      });
      macdLineSeries.setData(
        data.macd.map((item) => ({ time: item.time, value: item.macd }))
      );

      // Signal Line (Orange)
      const signalLineSeries = chart.addLineSeries({
        color: "#fb923c",
        lineWidth: 1.5,
        title: "Signal",
      });
      signalLineSeries.setData(
        data.macd.map((item) => ({ time: item.time, value: item.signal }))
      );

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (macdContainerRef.current && chart) {
          chart.applyOptions({ width: macdContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chart) chart.remove();
      };
    });

    return () => {
      isCancelled = true;
      if (chart) chart.remove();
    };
  }, [activeTab, data.macd]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#0d1322] p-5 shadow-xl">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
        {/* Left: Timeframe Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-900/80 p-1 border border-gray-800">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                period === p.value
                  ? "bg-cyan-500 text-gray-900 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Center: SMA Overlays Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSma20(!showSma20)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
              showSma20
                ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300"
                : "bg-gray-900/60 border-gray-800 text-gray-500 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            SMA 20
          </button>

          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
              showSma50
                ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                : "bg-gray-900/60 border-gray-800 text-gray-500 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            SMA 50
          </button>
        </div>

        {/* Right: Technical Panel Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-900/80 p-1 border border-gray-800 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              activeTab === "overview"
                ? "bg-gray-800 text-white font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Price & Volume
          </button>
          <button
            onClick={() => setActiveTab("rsi")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              activeTab === "rsi"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/50 font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setActiveTab("macd")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              activeTab === "macd"
                ? "bg-blue-900/50 text-blue-300 border border-blue-700/50 font-semibold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            MACD (12,26,9)
          </button>
        </div>
      </div>

      {/* Candlestick & Primary Chart Container */}
      <div className="mt-4 relative min-h-[420px] w-full">
        <div ref={chartContainerRef} className="w-full h-[420px]" />
      </div>

      {/* Sub-panel: RSI */}
      {activeTab === "rsi" && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Relative Strength Index (RSI 14)
            </span>
            <span className="text-[11px] text-gray-500">Bands: 70 Overbought | 30 Oversold</span>
          </div>
          <div ref={rsiContainerRef} className="w-full h-[200px]" />
        </div>
      )}

      {/* Sub-panel: MACD */}
      {activeTab === "macd" && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span> MACD (12, 26, 9) Momentum & Histogram
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-cyan-400">● MACD Line</span>
              <span className="text-orange-400">● Signal Line</span>
              <span className="text-gray-400">■ Histogram</span>
            </div>
          </div>
          <div ref={macdContainerRef} className="w-full h-[200px]" />
        </div>
      )}
    </div>
  );
};
