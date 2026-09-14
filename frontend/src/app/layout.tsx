import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaPulse India | Real-Time NSE & BSE Technical Signals",
  description: "Real-time Indian stock market dashboard with SMA, RSI, MACD indicators, candlestick charts, and rule-based trade recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
