# Production Deployment & Multiplayer Guide

This project is configured as a **single-port hybrid application**:
- The Node.js server (`server/index.js`) serves both the compiled Vite WebGL client (`dist/`) and the WebSocket Relay on the same port (`PORT`).
- Operates over standard HTTPS/WSS (port 443), eliminating firewall and NAT issues.

---

## 1. Local Production Simulation (Single Port)

To verify the production build locally:

```bash
# 1. Build client assets (WASM + JS + HTML into dist/)
npm run build

# 2. Start the unified production server
npm start
```

Open `http://localhost:3001` in two browser windows or different devices on your local Wi-Fi.

---

## 2. Deploying to Free Cloud Platforms

### Option A: Render (Zero Configuration)
1. Push your repository to GitHub.
2. Sign up / log in to [render.com](https://render.com).
3. Click **New +** -> **Web Service** -> Connect your GitHub repo.
4. Render automatically detects `render.yaml` or use these manual settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
   * **Plan:** `Free`
5. Click **Create Web Service**.
6. Once deployed, Render provides an HTTPS URL (e.g., `https://offroad-coop.onrender.com`).

### Option B: Railway / Fly.io / Docker
Deploy using the included multi-stage [Dockerfile](file:///C:/Users/manis/Development/drive/Dockerfile):
```bash
docker build -t offroad-coop .
docker run -p 3001:3001 -e PORT=3001 offroad-coop
```

---

## 3. How Anyone Can Join

1. Visit your deployed URL (e.g., `https://offroad-coop.onrender.com`).
2. The HUD displays your **Room Code** and a **[Copy Invite Link]** button.
3. Send the link (`https://offroad-coop.onrender.com/?room=EXPEDITION`) to any friend on any phone, tablet, or desktop browser.
4. When they open the link, they automatically drop into your world as **Driver 2 (Rescue Orange)** with physical collision and real-time synchronization.
