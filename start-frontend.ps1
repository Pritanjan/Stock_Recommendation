# Script to start the Next.js frontend server
Write-Host "Starting Next.js Frontend Server on http://localhost:3000..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
