export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  year_high: number;
  year_low: number;
  volume: number;
  market_cap?: number | null;
  pe_ratio?: number | null;
  currency: string;
  last_updated: number;
}

export interface CandlestickPoint {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: string | number;
  value: number;
  color: string;
}

export interface LinePoint {
  time: string | number;
  value: number;
}

export interface MacdPoint {
  time: string | number;
  macd: number;
  signal: number;
  hist: number;
}

export interface ChartData {
  candlesticks: CandlestickPoint[];
  volume: VolumePoint[];
  sma_20: LinePoint[];
  sma_50: LinePoint[];
  rsi: LinePoint[];
  macd: MacdPoint[];
}

export interface IndicatorBreakdownItem {
  signal: string;
  score: number;
  weight: number;
  details: string;
  [key: string]: any;
}

export interface Recommendation {
  verdict: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
  score: number;
  sentiment: string;
  summary: string;
  breakdown: {
    sma: IndicatorBreakdownItem;
    rsi: IndicatorBreakdownItem;
    macd: IndicatorBreakdownItem;
  };
}

export interface StockAnalysisResponse {
  symbol: string;
  period: string;
  interval: string;
  quote: StockQuote;
  indicators: {
    price: number;
    prev_price: number;
    sma_20: number;
    sma_50: number;
    rsi_14: number;
    macd: number;
    macd_signal: number;
    macd_hist: number;
  };
  recommendation: Recommendation;
  chart_data: ChartData;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  sector?: string;
  is_nifty50?: boolean;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  sma_20?: number;
  sma_50?: number;
  sma_trend?: string;
  rsi?: number;
  rsi_signal?: string;
  macd_signal?: string;
  recommendation: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
  score: number;
}
