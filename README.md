<div align="center">

# **🎬 Stream Player Pro v2.0**

> A high-performance, zero-dependency streaming web player with instant preconnect buffering, MKV multi-audio inspection, YouTube-style touch gestures, visionOS liquid glass UI, and Cloudflare Workers proxy support.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare)](https://stream.harisgarage.workers.dev)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Link--To--Play-181717?style=for-the-badge&logo=github)](https://github.com/Link-To-Play/Link_To_Play)
[![Default Branch](https://img.shields.io/badge/Branch-hari-blue?style=for-the-badge&logo=git)](https://github.com/Link-To-Play/Link_To_Play/tree/hari)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

[![Organization](https://img.shields.io/badge/Organization-Link--To--Play-181717?style=flat-square&logo=github)](https://github.com/Link-To-Play)
[![Original Idea & Architecture](https://img.shields.io/badge/Idea_%26_Architecture-hariharanboss-2563eb?style=flat-square&logo=github)](https://github.com/hariharanboss)
[![Base Code & Theme](https://img.shields.io/badge/Base_Code_%26_Theme-srikrishnadeveloper-181717?style=flat-square&logo=github)](https://github.com/srikrishnadeveloper)

<br/>

`#video-player` &bull; `#html5-video` &bull; `#mkv-player` &bull; `#streaming` &bull; `#cloudflare-workers` &bull; `#visionos-glass` &bull; `#gestures` &bull; `#pwa`

</div>

---

## 🌐 Live Website & Direct Stream Loading

* **Production URL:** [https://stream.harisgarage.workers.dev](https://stream.harisgarage.workers.dev)
* **Direct Stream Loading (URL Parameter):**  
  ```text
  https://stream.harisgarage.workers.dev/?video=<YOUR_STREAM_URL>
  ```
  *(Also supports `?url=`, `?stream=`, and hash formats `#video=<URL>`)*

---

## ✨ Cutting-Edge Features

### ⚡ 1. Instant Stream Sniffer & Preconnect Buffering
* **Microsecond Socket Warming:** The moment a stream URL is detected in the URL query or hash, the player injects DNS prefetch and TLS preconnections (`<link rel="preconnect">`) in `<head>` before page styles finish parsing.
* **Non-Blocking In-Flight Media Pipeline:** Attaches the media source directly when the `<video>` DOM node is parsed, initiating media streaming in the background without waiting for the bottom scripts or heavy assets to load.
* **Deferred Shaders (`liquidGL.js`):** The 297 KB WebGL/WebGPU shader engine is deferred so shader compilation never blocks video buffering or UI interaction.
* **Muted Buffer-Fill Fallback:** Bypasses mobile autoplay blocks by seamlessly buffering frames in muted mode, unmuting automatically on the very first screen touch or click.

### 🎬 2. Direct MKV & MP4 Streaming Engine
* **High-Speed Direct Playback:** Streams full-bitrate MKV, MP4, WebM, and MOV containers directly from the upstream media host.
* **Worker Proxy Fallback (`worker.js`):** Seamless Cloudflare Edge Worker proxy mode to bypass strict corporate firewalls, missing CORS headers, or network restrictions.

### 🔊 3. Multi-Track Audio & Subtitle Inspector
* **EBML / Header Range Inspector:** Reads the first 2 MB container header on demand without downloading the entire video file.
* **Audio Track Detection:** Inspects embedded audio streams including **Dolby Digital (AC-3)**, **Dolby Digital Plus (E-AC-3)**, **AAC (2.0 / 5.1 / 7.1)**, sample rates, and bitrates.
* **Embedded Subtitles:** Displays embedded SRT and VTT subtitle track availability directly in the Media Info drawer.
* **Audio Badges:** Real-time top/bottom badges displaying active audio track count and channel format (e.g. `5.1 Audios`).

### 📱 4. Mobile Double-Tap & Gesture Engine
* **Double-Tap Left / Right (±10s Seek):** JioHotstar-style visionOS animated glass ripple showing cumulative seconds (`-10s`, `-20s`, `+10s`, etc.).
* **Zero UI Interruption:** Double-tapping to skip does not pop up or wake the main control overlay, keeping the viewing experience completely immersive.
* **Press & Hold (2× Speed Boost):** Long-pressing anywhere on the video accelerates playback to 2× speed, returning to normal speed upon release.
* **Orientation Lock:** Automatically switches to landscape mode upon entering full-screen on mobile devices.

### 🚀 5. Universal External Player Matrix
* **Open in VLC (Manual):** One-tap pop-up providing direct stream copy, instant `.m3u` playlist file download, and direct Android `intent://` links.
* **Desktop App Handoff:** Dedicated direct URI schemes for **PotPlayer** (`potplayer://`), **MPV** (`mpv://`), and macOS **IINA** (`iina://weblink`).

### 🔮 6. visionOS Liquid Glass UI & Dynamic Layout
* **Adaptive Responsive Control Hub:** Dynamically reconfigures control sizing and spacing across Mobile (`<= 520px`), Tablet (`<= 900px`), and Desktop (`> 900px`).
* **VisionOS Refraction Engine:** Optional hardware-accelerated WebGL glass lens with prismatic chromatic dispersion and subtle ripple interactions.
* **Apple Spoke Loader:** Fluid, minimalist spoke spinner indicating initial loading and seek buffering.

### 🔲 7. Aspect Ratio & Screen Fit Engine
* **Multiple Display Modes:**
  * **Fit (Contain):** Displays native aspect ratio with black bars (default).
  * **Fill Screen (Crop):** Expands to fill all four edges with zero black bars (ideal for 19.5:9 smartphones and 21:9 ultrawide monitors).
  * **Stretch:** Fills screen dimensions directly without cropping.
  * **16:9 / 21:9 / 4:3:** Standard cinema and broadcast ratios.
* **On-Screen HUD Toast:** Smooth top pill badge acknowledging aspect ratio switches.

### 🎛️ 8. GPU-Accelerated Real-Time Video Adjustments
* **Live Video Filters:** Adjust Brightness (30%–200%), Contrast (30%–200%), Saturation (0%–250%), and Hue (0°–360°) on the fly with 1-click reset.

---

## ⌨️ Keyboard Shortcuts (Desktop)

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> (Tap) | Play / Pause toggle |
| <kbd>Space</kbd> (Hold) | 2× Playback Speed Boost (restores on release) |
| <kbd>←</kbd> (Arrow Left) | Seek backward 10 seconds (silent seek without UI wakeup) |
| <kbd>→</kbd> (Arrow Right) | Seek forward 10 seconds (silent seek without UI wakeup) |
| <kbd>↑</kbd> (Arrow Up) | Increase Volume by 5% (displays top Capsule HUD) |
| <kbd>↓</kbd> (Arrow Down) | Decrease Volume by 5% (displays top Capsule HUD) |
| <kbd>Z</kbd> or <kbd>A</kbd> | Cycle Aspect Ratio (`Fit` ➔ `Fill` ➔ `Stretch` ➔ `16:9` ➔ `21:9` ➔ `4:3`) |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>P</kbd> | Toggle Picture-in-Picture (PiP) |
| <kbd>M</kbd> | Mute / Unmute (with smart volume memory) |
| <kbd>Esc</kbd> | Close Settings Drawer / VLC Modal |

---

## 📁 Repository Structure

```text
├── index.html                       # Complete player web application (HTML, CSS, JS)
├── worker.js                        # Cloudflare Worker streaming proxy & asset handler
├── wrangler.toml                    # Cloudflare deployment configuration
├── liquidGL.js                      # WebGPU/WebGL visionOS liquid glass shader engine
├── manifest.json                    # Progressive Web App (PWA) manifest
├── favicon.ico                      # High-resolution multi-size favicon
├── favicon.png                      # 32x32 transparent neon squircle favicon
├── apple-touch-icon.png             # 180x180 iOS home-screen icon
├── icon-192.png                     # 192x192 PWA app icon
├── icon-512.png                     # 512x512 PWA app icon
├── DEPLOY.md                        # Deployment documentation
└── README.md                        # Project documentation
```

---

## 🛠️ Local Development

Because this project is built using native Web APIs without bundlers or heavy dependencies, running locally requires zero build steps:

```bash
# Option 1: Python HTTP Server
python -m http.server 8080

# Option 2: Wrangler Cloudflare Worker Dev
npx wrangler dev
```

---

## ☁️ Cloudflare Workers Deployment

This player deploys directly to **Cloudflare Workers with Static Assets** (free tier supported):

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Deploy to Cloudflare Workers
wrangler deploy
```

> **Note for Windows users:** If Node.js encounters TLS handshake negotiation resets, run:
> ```powershell
> $env:NODE_OPTIONS="--tls-min-v1.3"; wrangler deploy
> ```

---

## 👥 Authors & Credits

* **GitHub Repository:** [https://github.com/Link-To-Play/Link_To_Play](https://github.com/Link-To-Play/Link_To_Play)
* **Organization:** [Link-To-Play](https://github.com/Link-To-Play)

| Contributor | Role & Key Contributions |
| :--- | :--- |
| **[@hariharanboss](https://github.com/hariharanboss)** | **Original Idea, Architecture & Advanced Streaming Engine**<br/>• Conceived the original concept, player architecture, and visionOS theme.<br/>• Built the instant stream preconnect sniffer and in-flight media loading pipeline.<br/>• Implemented MKV multi-audio and subtitle inspector engine.<br/>• Designed JioHotstar double-tap seek, external player matrix (VLC/MPV/PotPlayer), and gesture engine.<br/>• Configured Cloudflare Workers proxy (`worker.js`) and deployment workflows. |
| **[@srikrishnadeveloper](https://github.com/srikrishnadeveloper)** | **Theme Concept & Base Implementation**<br/>• Conceived the initial visual theme and aesthetic of the player.<br/>• Authored foundational layout elements and core video wrapper structure. |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
