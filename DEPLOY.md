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

## Streaming a movie

Visit `https://stream.harisgarage.workers.dev` to access the landing screen, where
you can paste any MKV or MP4 stream URL to play it instantly.

Alternatively, provide the URL directly as a query parameter:
`https://stream.harisgarage.workers.dev/?video=<STREAM_URL>`

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
