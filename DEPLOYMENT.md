# ?? Deployment Guide - AlphaPulse India Dashboard

This document provides complete instructions for deploying both the **FastAPI Backend** and the **Next.js Frontend**.

---

## ?? 1. Local Running (Current Setup)

Both development servers are currently running locally:

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **API Docs (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

To restart manually in the future:
`powershell
# In terminal 1:
.\start-backend.ps1

# In terminal 2:
.\start-frontend.ps1
`

---

## ?? 2. Free Cloud Deployment (Vercel + Render)

The recommended production stack for this project is:
- **Frontend**: **Vercel** (Free tier, global CDN, native Next.js support)
- **Backend**: **Render** or **Railway** (Free tier, native FastAPI/Python support)

### Step 1: Push Code to GitHub
1. Initialize git and commit:
   `ash
   git init
   git add .
   git commit -m " Initial commit: AlphaPulse India Stock Dashboard\
 `
2. Create a GitHub repository and push your code:
 `ash
 git remote add origin https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git
 git branch -M main
 git push -u origin main
 `

### Step 2: Deploy Backend to Render (Free)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
 - **Name**: lphapulse-backend
 - **Root Directory**: ackend
 - **Environment**: Python 3
 - **Build Command**: pip install -r requirements.txt
 - **Start Command**: uvicorn main:app --host 0.0.0.0 --port 
 - **Instance Type**: Free
4. Click **Create Web Service**.
5. Once deployed, copy your backend public URL (e.g. https://alphapulse-backend.onrender.com).

### Step 3: Deploy Frontend to Vercel (Free)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Connect your GitHub repository.
3. Configure project settings:
 - **Framework Preset**: Next.js
 - **Root Directory**: Click Edit and select rontend.
4. Add **Environment Variables**:
 - NEXT_PUBLIC_API_URL: https://alphapulse-backend.onrender.com (your Render URL)
 - NEXT_PUBLIC_WS_URL: wss://alphapulse-backend.onrender.com (using wss:// for secure WebSockets)
5. Click **Deploy**.
6. Your site is live worldwide!

---

## ?? 3. Docker & Docker Compose Deployment

If deploying to a VPS (DigitalOcean, AWS EC2, Linode, Hetzner, etc.):

1. Ensure Docker and Docker Compose are installed.
2. Clone the repository and run:
 `ash
 docker-compose up --build -d
 `
3. Your application is live at:
 - Frontend: http://<YOUR-SERVER-IP>:3000
 - Backend API: http://<YOUR-SERVER-IP>:8000

---

## ? 4. 1-Click Blueprint on Render (ender.yaml)

We have included a ender.yaml blueprint. In Render:
1. Go to **Blueprints > New Blueprint Instance**.
2. Connect your repository.
3. Render will automatically configure and deploy both the backend API and frontend UI services.
