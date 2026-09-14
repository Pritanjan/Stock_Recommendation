# Script to start the FastAPI backend server
Write-Host "Starting FastAPI Backend Server on http://127.0.0.1:8000..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& ".\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
