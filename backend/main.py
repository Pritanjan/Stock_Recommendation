from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.stocks import router as stocks_router

app = FastAPI(
    title="Real-Time Stock Analytics & Technical Signals API",
    description="FastAPI service for financial quotes, technical indicators (SMA 20/50, RSI 14, MACD), and rule-based recommendations.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks_router)

@app.get("/")
def root():
    return {
        "service": "AlphaPulse India - Stock Analytics API",
        "status": "online",
        "frontend_dashboard": "http://localhost:3000",
        "interactive_api_docs": "http://127.0.0.1:8000/docs",
        "message": "Backend API is online and healthy. Visit http://localhost:3000 for the full interactive visual dashboard with charts and real-time signals."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-stock-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
