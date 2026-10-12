# 🎬 Stream Player Pro

> A high-performance, zero-dependency streaming web player with gesture controls, VLC-style edge HUDs, hardware video acceleration, and Cloudflare Workers proxy support.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare)](https://stream.harisgarage.workers.dev)
[![GitHub Branch](https://img.shields.io/badge/Branch-hari-181717?style=for-the-badge&logo=github)](https://github.com/Link-To-Play/Link_To_Play/tree/hari)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🌐 Live Website

* **Production URL:** [https://stream.harisgarage.workers.dev](https://stream.harisgarage.workers.dev)
* **Direct Stream Loading:**  
  `https://stream.harisgarage.workers.dev/?video=<YOUR_STREAM_URL>`

---

## ✨ Features

### 🌟 Landing Screen & Stream Input
* **Modern Web Interface:** Input bar allowing users to paste any direct `.mkv` or `.mp4` stream link and launch playback immediately.
* **URL Parameter Integration:** Automatically starts streams passed via `?video=` or `?url=` parameters without needing to use the landing input.
* **Stream Resume Memory:** Saves timestamps every 5 seconds to `localStorage`; automatically offers to resume from where you left off.

### 🔊 Interactive Audio & Edge Volume HUD
* **VLC-Style Vertical Edge HUD:** Shows an interactive volume bar and exact percentage badge (`0%`–`100%`) pinned to the screen edge.
* **Smooth Animation & Auto-Fade:** Glides into view with subtle glassmorphism and fades out smoothly after 1 second of inactivity.
* **Smart Volume Memory:** Pressing <kbd>M</kbd> remembers your last volume level and toggles between mute and your previous volume.
* **Dynamic Status Badges:** Displays active audio codec (`AAC Stereo`, etc.) with a live status indicator dot.

### 🔲 Aspect Ratio & Screen Fit Toggles
* **Multiple Display Modes:**
  * **Fit (Contain):** Displays native aspect ratio with black bars if dimensions don't match (default).
  * **Fill Screen (Crop):** Zooms in to touch all four edges with **zero black bars** (ideal for tall smartphones and ultrawide 21:9 monitors).
  * **Stretch:** Forces the video to fill the screen dimensions without cropping.
  * **16:9 / 21:9 / 4:3:** Standard broadcast and cinema aspect ratios.
* **Control Bar Quick Toggle:** Dedicated aspect button on the control bar and pills inside the Settings drawer.
* **On-Screen Toast Badge:** Flashes a top-center pill badge (`Fit`, `Fill (Crop)`, `Stretch`, etc.) whenever toggled.

### 🎛️ Real-Time Video Adjustments
* **GPU-Accelerated Filters:** Real-time adjustments without re-encoding or buffering:
  * **Brightness:** 30% – 200%
  * **Contrast:** 30% – 200%
  * **Saturation:** 0% – 250%
  * **Hue Rotate:** 0° – 360°
* **1-Click Reset:** Instantly returns all adjustments back to default 100%.

### 📱 Touch Gestures (Mobile / Tablet)
* **Single Tap:** Toggle player controls UI and play/pause.
* **Double Tap (Left / Right):** YouTube-style animated ripple seek (rewind -10s or fast-forward +10s).
* **Press & Hold:** Activates **2× Speed Boost** until released.
* **Vertical Swipes:**
  * **Left Side Swipe:** Volume control with edge HUD.
  * **Right Side Swipe:** Brightness control with edge HUD.

### 🛡️ Built-in Streaming Proxy (`worker.js`)
* Bypasses firewalls, restrictive campus networks, and missing CORS headers.
* Proxies byte-range requests (`Range: bytes=...`) transparently to upstream media servers.

### 📲 Progressive Web App (PWA)
* Web app manifest (`manifest.json`) and high-resolution app icons (`icon-192.png`, `icon-512.png`).
* "Add to Home Screen" support on iOS & Android for a distraction-free, browser-chrome-free experience.

### 🚀 External VLC Integration
* Built-in **"Open in VLC"** helper for formats unsupported by mobile browsers or containing multi-audio tracks / DTS-HD codecs.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> (Tap) | Play / Pause toggle |
| <kbd>Space</kbd> (Hold) | 2× Playback Speed Boost (restores on release) |
| <kbd>↑</kbd> (Arrow Up) | Increase Volume by 5% (with on-screen HUD) |
| <kbd>↓</kbd> (Arrow Down) | Decrease Volume by 5% (with on-screen HUD) |
| <kbd>←</kbd> (Arrow Left) | Seek backward 10 seconds |
| <kbd>→</kbd> (Arrow Right) | Seek forward 10 seconds |
| <kbd>Z</kbd> or <kbd>A</kbd> | Cycle Screen Fit / Aspect Ratio (`Fit` ➔ `Fill` ➔ `Stretch` ➔ `16:9` ➔ `21:9` ➔ `4:3`) |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>P</kbd> | Toggle Picture-in-Picture (PiP) |
| <kbd>M</kbd> | Mute / Unmute (with volume memory) |
| <kbd>Esc</kbd> | Close Settings Drawer / VLC Modal |

---

## 📁 Repository Structure

```text
├── index.html                       # Core player application (HTML, CSS, JS)
├── worker.js                        # Cloudflare Worker streaming proxy & asset handler
├── wrangler.toml                    # Cloudflare deployment configuration
├── manifest.json                    # Progressive Web App (PWA) manifest
├── icon-192.png                     # PWA icon (192x192)
├── icon-512.png                     # PWA icon (512x512)
├── DEPLOY.md                        # Quick deploy reference notes
├── README.md                        # Project documentation
└── loader animations/
    ├── Arm Wave Loader.html
    ├── Moonwalk Loader.html
    ├── Stick Figure Pull-up Loader.html
    └── Stick Figure Push-up Loader.html
```

---

## 🛠️ Local Development

Because this project is built entirely using standard HTML5, CSS3, and JavaScript, **no build step or bundler is required**.

### Running Locally:

1. **Option 1: Python HTTP Server**
   ```bash
   python -m http.server 8080
   ```
   Open `http://localhost:8080` in your browser.

2. **Option 2: VS Code Live Server**
   Right-click `index.html` and choose **"Open with Live Server"**.

3. **Option 3: Wrangler Local Dev**
   ```bash
   npx wrangler dev
   ```

---

## ☁️ Cloudflare Workers Deployment

This player is configured to run on **Cloudflare Workers with Static Assets** (free tier compatible).

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Deploy
```bash
npx wrangler deploy
```

Your player will be deployed to `https://stream.<your-subdomain>.workers.dev`.  
To customize the subdomain name, update `name = "stream"` in `wrangler.toml`.

---

## 💡 Notes & Compatibility

* **Media Format Support:**
  * **MP4 (H.264 / AAC):** Supported natively across all browsers and devices.
  * **MKV:** Supported natively in Chromium-based browsers (Google Chrome, Microsoft Edge, Brave, Opera). Safari and iOS WebViews require the built-in **"Open in VLC"** button for non-native codecs.
* **CORS Requirement:** Upstream video streams must include CORS headers (`Access-Control-Allow-Origin: *`). If the stream host blocks CORS, enable **Proxy Stream Mode** in the player drawer.
