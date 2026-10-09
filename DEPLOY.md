# Hari Player — Deploy Guide

A standalone video player page. Everything lives in `index.html` —
HTML, CSS, and JavaScript are all in that one file. No build step.

## Deploy to Cloudflare Workers (free)

```bash
npm install -g wrangler
wrangler login          # opens browser, approve once
wrangler deploy         # run inside this folder
```

That's it — it goes live at `https://hari-player.<your-subdomain>.workers.dev`

To change the name/subdomain, edit `name = "hari-player"` in `wrangler.toml`.

## Change the movie

Open `index.html`, find this line near the top of the `<script>` block:

```js
const DEV_STREAM_URL = 'https://f2l.harisgarage.workers.dev/stream/1904?hash=6086d183e1805fd55878119458cfc226';
```

Replace with your stream URL. Users can also override it at runtime with
`?video=<url>` — no redeploy needed for testing.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire player — edit everything here |
| `manifest.json` | PWA config (fullscreen app launch, landscape lock) |
| `icon-192.png` / `icon-512.png` | App icons for "Add to Home Screen" |
| `wrangler.toml` | Cloudflare deploy config |

## Player features

- Custom UI: title top-left, bottom seek bar (red watched fill), time,
  volume popup, settings drawer
- Gestures: tap = play/pause, double-tap ±10s, hold = play / 2x speed,
  left swipe = volume, right swipe = brightness
- Settings: speed, loop, audio track info, brightness/contrast/
  saturation/hue + reset, download, open in VLC, copy direct link
- Keyboard: Space, arrows, F, M
- Auto-fullscreen on first tap, landscape lock on mobile
- PWA: "Add to Home Screen" → launches fullscreen, no browser UI

## Notes

- Stream must be MKV/MP4 with CORS headers (`Access-Control-Allow-Origin: *`)
- MKV plays in Chrome/Edge; Safari needs VLC (button built in)
- True zero-tap fullscreen requires the PWA install — browsers block
  fullscreen before the first user gesture
