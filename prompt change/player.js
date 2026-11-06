/**
 * STREAM PLAYER PRO v2.0 — RESILIENT MEDIA ENGINE
 * Architecture: Clean HTML5 Media, WebGL Glass Tiering, Container Layouts,
 * Hardened Cloudflare Proxy Integration, Honest ISO BMFF & EBML Inspection.
 */

(() => {
    'use strict';

    /* ==========================================================================
       1. GLOBAL STATE & CONSTANTS
       ========================================================================== */
    const $ = id => document.getElementById(id);

    // Core DOM Elements
    const stage = $('stage');
    const video = $('video');
    const spinner = $('spinner');
    const centerIcon = $('centerIcon');
    const centerPath = $('centerPath');
    const playBtn = $('playBtn');
    const icoPlay = $('icoPlay');
    const icoPause = $('icoPause');
    const volWrap = $('volWrap');
    const volBtn = $('volBtn');
    const volTrack = $('volTrack');
    const volFill = $('volFill');
    const volThumb = $('volThumb');
    const volPct = $('volPct');
    const volPopIcon = $('volPopIcon');
    const seekWrap = $('seekWrap');
    const seekSlider = $('seek');
    const seekBuffer = $('seekBuffer');
    const seekFill = $('seekFill');
    const seekThumb = $('seekThumb');
    const seekTooltip = $('seekHoverTooltip');
    const timeCurrent = $('timeCurrent');
    const timeRemaining = $('timeRemaining');
    const aspectWrap = $('aspectWrap');
    const aspectBtn = $('aspectBtn');
    const pipBtn = $('pipBtn');
    const setBtn = $('setBtn');
    const fsBtn = $('fsBtn');
    const errBox = $('err');
    const movieName = $('movieName');
    const settingsDrawer = $('settingsDrawer');
    const drawerOverlay = $('drawerOverlay');
    const landingScreen = $('landingScreen');
    const toastHud = $('toastHud');
    const hudIcon = $('hudIcon');
    const hudLabel = $('hudLabel');
    const hudBar = $('hudBar');
    const hudBarFill = $('hudBarFill');
    const debugOverlay = $('debugOverlay');

    // SVG Icons
    const D_PLAY = 'M8 5v14l11-7z';
    const D_PAUSE = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
    const ICON_MUTE = 'M3 9v6h4l5 5V4L7 9H3zm14.6 3l2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7z';
    const ICON_LOW = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z';
    const ICON_FULL = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z';
    const ICON_SUN = 'M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm-1-16h2v3.5h-2V1.5zm0 17.5h2v3.5h-2V19zm9.5-8v2h-3.5v-2h3.5zM5 11v2H1.5v-2H5zm12.36-6.95l1.41 1.41-2.47 2.47-1.41-1.41 2.47-2.47zm-11.31 11.3l1.41 1.42-2.47 2.47-1.42-1.41 2.48-2.48zm13.78 2.48l-1.41 1.41-2.48-2.47 1.41-1.42 2.48 2.48zM6.05 4.64l1.41 1.41-2.47 2.48-1.41-1.42 2.47-2.47z';
    const ICON_SPEED = 'M4 6l8 6-8 6V6zm9 0l8 6-8 6V6z';
    const ICON_FIT = 'M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zm-2-10h-4v2h4V8zm0 4h-4v2h4v-2zm-6-4H7v6h4V8z';

    // Application State
    let streamUrl = '';
    let currentFitMode = 'contain';
    let normalSpeed = 1.0;
    let showRemainingTime = true;
    let scrubbing = false;
    let prevSeekTime = 0;
    let isMouseOverUI = false;
    let wakeUiTimer = null;
    let loadStreamAbort = null;
    let autoFallbackDone = false;
    let lastResumeWriteTime = 0;
    let lastTapTime = 0;
    let lastTapSide = '';
    let tapTimer = null;
    let centerTimer = null;
    let gesture = null;
    let isHoldingSpeed = false;
    let proxyReachable = null; // cached probe
    let metadataInspected = false;
    let lastReportedError = '';

    // Device & Platform Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Video Adjustment State (Brightness, Contrast, Saturation, Hue)
    const fx = { bri: 100, con: 100, sat: 100, hue: 0 };

    // Media Info Metadata Model
    const mediaFileInfo = {
        format: '',
        fileSize: '',
        video: { codec: '', width: 0, height: 0, fps: '' },
        audioCount: 0,
        audioTracks: []
    };

    // User Preferences
    let useProxy = false;
    try {
        const storedProxy = localStorage.getItem('stream_proxy_mode');
        if (storedProxy !== null) useProxy = storedProxy === 'true';
    } catch (_) {}

    /* ==========================================================================
       2. UTILITIES & SECURITY SANITIZATION (XSS Prevention)
       ========================================================================== */
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fmtTime(sec) {
        if (!Number.isFinite(sec) || sec < 0) return '0:00';
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '—';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function isOpaqueId(str) {
        if (!str) return true;
        const s = str.trim();
        if (/^[a-f0-9]{32,}$/i.test(s)) return true;
        if (/^[a-z0-9_-]{22,}={0,2}$/i.test(s) && !s.includes(' ')) return true;
        if (/^[0-9]+$/.test(s) && s.length >= 8) return true;
        return false;
    }

    // Item 20: Clean title without truncating common words like "web"
    function cleanTitleString(raw) {
        if (!raw) return '';
        let str = String(raw).trim();
        str = str.replace(/^["']|["']$/g, '');
        str = str.replace(/\.(mkv|mp4|avi|webm|mov|m4v|ts|flv)$/i, '');
        str = str.replace(/[_]/g, ' ');
        if (!str.includes(' ') && str.includes('.')) {
            str = str.replace(/\./g, ' ');
        }
        // Match specific scene release tags only; do NOT match generic words like "web"
        str = str.replace(/\b(1080p|720p|480p|2160p|4k|uhd|bluray|blu-ray|web-dl|webrip|hdtv|x264|x265|hevc|h264|h265|aac|dts|ddp5\.1|dd5\.1|atmos|proper|repack)\b.*/i, '');
        str = str.replace(/\[[^\]]*\]/g, '');
        str = str.replace(/\s*\(\s*(\d{4})\s*\)/, ' ($1)');
        str = str.replace(/[\s\.\-_]+$/, '').replace(/^\s+/, '');
        str = str.replace(/\s+/g, ' ').trim();
        return str;
    }

    function cleanTitleFromUrl(url) {
        if (!url) return 'STREAM';
        try {
            const cached = lruGet('stream_title_cache', url);
            if (cached && !isOpaqueId(cached) && cached !== 'STREAM' && cached !== 'Loading…') {
                return cached;
            }
        } catch (_) {}

        try {
            const u = new URL(url);
            let part = u.searchParams.get('title') || u.searchParams.get('name') || u.searchParams.get('file');
            if (part) {
                const c = cleanTitleString(part);
                if (c && !isOpaqueId(c)) return c;
            }
            const segs = u.pathname.split('/').filter(Boolean);
            if (segs.length) {
                const c = cleanTitleString(decodeURIComponent(segs[segs.length - 1]));
                if (c && !isOpaqueId(c)) return c;
            }
        } catch (_) {}
        return 'STREAM';
    }

    // LRU LocalStorage Management (Cap 50 entries)
    function lruSet(namespace, key, value, maxEntries = 50) {
        try {
            const metaKey = namespace + ':__meta_lru__';
            let list = [];
            try { list = JSON.parse(localStorage.getItem(metaKey) || '[]'); } catch (_) {}
            list = list.filter(k => k !== key);
            list.unshift(key);

            // Prune excess items
            while (list.length > maxEntries) {
                const oldKey = list.pop();
                localStorage.removeItem(namespace + ':' + oldKey);
            }
            localStorage.setItem(metaKey, JSON.stringify(list));
            localStorage.setItem(namespace + ':' + key, String(value));
        } catch (_) {}
    }

    function lruGet(namespace, key) {
        try {
            return localStorage.getItem(namespace + ':' + key);
        } catch (_) {
            return null;
        }
    }

    /* ==========================================================================
       3. URL STREAM PARAMETER PARSING (?video=)
       ========================================================================== */
    // Item 3: Extract raw text after video= / url= / stream= up to #; decode only percent-encoded
    function parseStreamUrlFromLocation() {
        const href = window.location.href;
        const match = href.match(/[?&](?:video|url|stream)=([^#]*)/i);
        if (!match || !match[1]) return '';
        let raw = match[1];
        if (/%[0-9a-fA-F]{2}/.test(raw)) {
            try { raw = decodeURIComponent(raw); } catch (_) {}
        }
        return raw.trim();
    }

    function getEffectiveStreamUrl(targetUrl) {
        if (!targetUrl) return '';
        if (useProxy) {
            return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
        }
        return targetUrl;
    }

    /* ==========================================================================
       4. PROXY REACHABILITY PROBE & CACHE
       ========================================================================== */
    // Item 9: Session-wide single probe with 2s timeout
    async function probeProxyReachable() {
        if (proxyReachable !== null) return proxyReachable;
        try {
            const signal = AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined;
            const res = await fetch('/api/proxy', { method: 'OPTIONS', signal });
            proxyReachable = res.ok || res.status === 204 || res.status === 400;
        } catch (_) {
            proxyReachable = false;
        }
        return proxyReachable;
    }

    /* ==========================================================================
       5. CAPABILITY CHECKS & HARDWARE OVERLAYS
       ========================================================================== */
    function initializeCapabilityHiding() {
        // PiP capability
        const canPip = document.pictureInPictureEnabled || (video && typeof video.webkitSetPresentationMode === 'function');
        if (!canPip && pipBtn) {
            pipBtn.classList.add('unsupported');
            pipBtn.hidden = true;
        }

        // iOS/iPadOS Volume capability (video.volume is read-only)
        if (isIOS) {
            if (volWrap) {
                volWrap.classList.add('unsupported');
                volWrap.hidden = true;
            }
        }
    }

    // Item 21: Clear identity filter to unblock hardware overlay plane
    function applyFx() {
        if (fx.bri === 100 && fx.con === 100 && fx.sat === 100 && fx.hue === 0) {
            video.style.filter = '';
        } else {
            video.style.filter = `brightness(${fx.bri}%) contrast(${fx.con}%) saturate(${fx.sat}%) hue-rotate(${fx.hue}deg)`;
        }
        if ($('fBri')) $('fBri').value = fx.bri;
        if ($('oBri')) $('oBri').textContent = fx.bri + '%';
        if ($('fCon')) $('fCon').value = fx.con;
        if ($('oCon')) $('oCon').textContent = fx.con + '%';
        if ($('fSat')) $('fSat').value = fx.sat;
        if ($('oSat')) $('oSat').textContent = fx.sat + '%';
        if ($('fHue')) $('fHue').value = fx.hue;
        if ($('oHue')) $('oHue').textContent = fx.hue + '°';
    }

    /* ==========================================================================
       6. UNIFIED HUD & TOAST SYSTEM (Never Overlapping)
       ========================================================================== */
    let toastTimer = null;
    function showToastHud({ iconPath, label, pct = null, duration = 1500 }) {
        clearTimeout(toastTimer);
        if (!toastHud) return;

        if (iconPath) {
            hudIcon.innerHTML = `<path d="${iconPath}"/>`;
            hudIcon.style.display = 'block';
        } else {
            hudIcon.style.display = 'none';
        }

        hudLabel.textContent = label || '';

        if (pct !== null && Number.isFinite(pct)) {
            hudBar.style.display = 'block';
            hudBarFill.style.setProperty('--hud-pct', Math.max(0, Math.min(100, pct)) + '%');
        } else {
            hudBar.style.display = 'none';
        }

        toastHud.classList.add('show');
        toastTimer = setTimeout(() => {
            toastHud.classList.remove('show');
        }, duration);
    }

    function showVolumeHud(pct) {
        if (isIOS) return;
        const icon = pct === 0 ? ICON_MUTE : pct < 50 ? ICON_LOW : ICON_FULL;
        showToastHud({
            iconPath: icon,
            label: `Volume ${Math.round(pct)}%`,
            pct: pct,
            duration: 1400
        });
    }

    function showBrightnessHud(val) {
        const norm = Math.max(0, Math.min(100, ((val - 30) / 170) * 100));
        showToastHud({
            iconPath: ICON_SUN,
            label: `Brightness ${Math.round(val)}%`,
            pct: norm,
            duration: 1400
        });
    }

    function showSpeedToast(spd) {
        showToastHud({
            iconPath: ICON_SPEED,
            label: `${spd}× Speed`,
            duration: 1200
        });
    }

    function showFitToast(name) {
        showToastHud({
            iconPath: ICON_FIT,
            label: name,
            duration: 1200
        });
    }

    /* ==========================================================================
       7. SEEK BAR SLIDER (Custom Div-Based ARIA Slider)
       ========================================================================== */
    function getBufferedPct() {
        if (!video.duration || !video.buffered || !video.buffered.length) return 0;
        try {
            const cur = video.currentTime;
            for (let i = 0; i < video.buffered.length; i++) {
                if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
                    return Math.min(100, (video.buffered.end(i) / video.duration) * 100);
                }
            }
            return Math.min(100, (video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
        } catch (_) {
            return 0;
        }
    }

    function updateSeekDisplay(posPct) {
        const pct = Math.max(0, Math.min(100, posPct));
        const bufPct = Math.max(pct, getBufferedPct());
        seekSlider.style.setProperty('--play-pct', pct + '%');
        seekSlider.style.setProperty('--buf-pct', bufPct + '%');
        seekSlider.setAttribute('aria-valuenow', Math.round(pct));
    }

    function updateTimeDisplay() {
        const isLive = !Number.isFinite(video.duration) || video.duration <= 0;
        if (isLive) {
            timeCurrent.textContent = fmtTime(video.currentTime);
            timeRemaining.textContent = 'LIVE';
            seekSlider.setAttribute('aria-valuemin', 0);
            seekSlider.setAttribute('aria-valuemax', 0);
            return;
        }

        seekSlider.setAttribute('aria-valuemin', 0);
        seekSlider.setAttribute('aria-valuemax', 100);

        if (!scrubbing) {
            const pos = (video.currentTime / video.duration) * 100;
            updateSeekDisplay(pos);
            timeCurrent.textContent = fmtTime(video.currentTime);
            const rem = Math.max(0, video.duration - video.currentTime);
            timeRemaining.textContent = showRemainingTime ? '-' + fmtTime(rem) : fmtTime(video.duration);
        }
    }

    function initSeekBar() {
        if (!seekWrap || !seekSlider) return;

        function getPosFromEvent(e) {
            const rect = seekWrap.getBoundingClientRect();
            if (rect.width <= 0) return 0;
            return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        }

        function updateHoverTooltip(pos, clientX) {
            if (!seekTooltip || !Number.isFinite(video.duration) || video.duration <= 0) {
                if (seekTooltip) seekTooltip.classList.remove('show');
                return;
            }
            const sec = pos * video.duration;
            seekTooltip.textContent = fmtTime(sec);

            // Item 7: Clamp tooltip to bar edges
            const wrapRect = seekWrap.getBoundingClientRect();
            const tipWidth = seekTooltip.offsetWidth || 48;
            const halfTip = tipWidth / 2;
            const rawX = pos * wrapRect.width;
            const clampedX = Math.max(halfTip, Math.min(wrapRect.width - halfTip, rawX));
            seekTooltip.style.left = `${clampedX}px`;
            seekTooltip.classList.add('show');
        }

        seekWrap.addEventListener('pointerdown', e => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            e.stopPropagation();
            scrubbing = true;
            prevSeekTime = video.currentTime;
            seekWrap.classList.add('scrubbing');
            try { seekWrap.setPointerCapture(e.pointerId); } catch (_) {}

            const pos = getPosFromEvent(e);
            updateSeekDisplay(pos * 100);
            timeCurrent.textContent = fmtTime(pos * video.duration);
            updateHoverTooltip(pos, e.clientX);
        });

        seekWrap.addEventListener('pointermove', e => {
            const pos = getPosFromEvent(e);
            if (scrubbing) {
                if (Number.isFinite(video.duration) && video.duration > 0) {
                    updateSeekDisplay(pos * 100);
                    timeCurrent.textContent = fmtTime(pos * video.duration);
                    updateHoverTooltip(pos, e.clientX);
                }
            } else {
                updateHoverTooltip(pos, e.clientX);
            }
        });

        function endScrub(e, isCancel) {
            if (!scrubbing) return;
            scrubbing = false;
            seekWrap.classList.remove('scrubbing');
            try { seekWrap.releasePointerCapture(e.pointerId); } catch (_) {}
            if (seekTooltip && e.pointerType === 'touch') seekTooltip.classList.remove('show');

            if (!Number.isFinite(video.duration) || video.duration <= 0) return;

            // Item 7: On pointercancel, restore previous position and do NOT seek
            if (isCancel) {
                video.currentTime = prevSeekTime;
                updateTimeDisplay();
                return;
            }

            const pos = getPosFromEvent(e);
            video.currentTime = pos * video.duration;
            updateTimeDisplay();
        }

        seekWrap.addEventListener('pointerup', e => endScrub(e, false));
        seekWrap.addEventListener('pointercancel', e => endScrub(e, true));
        seekWrap.addEventListener('pointerleave', () => {
            if (!scrubbing && seekTooltip) seekTooltip.classList.remove('show');
        });

        // Keyboard navigation on slider
        seekSlider.addEventListener('keydown', e => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            let target = video.currentTime;
            if (e.key === 'ArrowLeft') target -= 5;
            else if (e.key === 'ArrowRight') target += 5;
            else if (e.key === 'PageDown') target -= 60;
            else if (e.key === 'PageUp') target += 60;
            else if (e.key === 'Home') target = 0;
            else if (e.key === 'End') target = video.duration;
            else return;

            e.preventDefault();
            video.currentTime = Math.max(0, Math.min(video.duration, target));
            updateTimeDisplay();
        });
    }

    /* ==========================================================================
       8. PLAYBACK CONTROLS, SPINNER & CENTER ICON
       ========================================================================== */
    let spinnerHideTimer = null;
    let spinnerShownAt = 0;

    function showSpinner() {
        if (!spinner) return;
        clearTimeout(spinnerHideTimer);
        spinnerShownAt = Date.now();
        spinner.classList.remove('hidden');
    }

    function hideSpinner(immediate = false) {
        if (!spinner) return;
        clearTimeout(spinnerHideTimer);
        if (immediate) {
            spinner.classList.add('hidden');
            return;
        }
        const elapsed = Date.now() - spinnerShownAt;
        const wait = Math.max(0, 200 - elapsed);
        spinnerHideTimer = setTimeout(() => {
            spinner.classList.add('hidden');
        }, wait);
    }

    function setPlayIcon() {
        const isPlaying = !video.paused && !video.ended;
        if (icoPlay) icoPlay.style.display = isPlaying ? 'none' : 'block';
        if (icoPause) icoPause.style.display = isPlaying ? 'block' : 'none';
    }

    function showCenter(pathD, sticky) {
        if (!centerIcon || !centerPath) return;
        centerPath.setAttribute('d', pathD);
        centerIcon.classList.remove('on', 'sticky');
        void centerIcon.offsetWidth; // Reflow for clean transition
        centerIcon.classList.add('on');
        if (sticky) {
            centerIcon.classList.add('sticky');
        } else {
            clearTimeout(centerTimer);
            centerTimer = setTimeout(() => {
                centerIcon.classList.remove('on', 'sticky');
            }, 600);
        }
    }

    // Item 18: togglePlay handles AbortError separately
    function togglePlay() {
        if (video.paused || video.ended) {
            if (video.readyState < 3) showSpinner();
            const p = video.play();
            if (p && p.catch) {
                p.catch(err => {
                    if (err && err.name === 'AbortError') return;
                    hideSpinner(true);
                    showCenter(D_PLAY, true);
                });
            }
        } else {
            video.pause();
            showCenter(D_PLAY, false);
        }
    }

    /* ==========================================================================
       9. VOLUME & FIT MODE CONTROLS
       ========================================================================== */
    let lastNonZeroVolume = 100;

    function setVolume(pct) {
        if (isIOS) return;
        pct = Math.max(0, Math.min(100, Math.round(pct)));
        if (pct > 0) lastNonZeroVolume = pct;
        video.volume = pct / 100;
        video.muted = pct === 0;

        if (volFill) volFill.style.height = pct + '%';
        if (volThumb) volThumb.style.bottom = pct + '%';
        if (volPct) volPct.textContent = pct;

        const iconPath = pct === 0 ? ICON_MUTE : pct < 50 ? ICON_LOW : ICON_FULL;
        if (icoVol) icoVol.innerHTML = `<path d="${iconPath}"/>`;
        if (volPopIcon) volPopIcon.innerHTML = `<path d="${iconPath}"/>`;
    }

    function toggleMute() {
        if (isIOS) return;
        if (video.muted || video.volume === 0) {
            setVolume(lastNonZeroVolume || 100);
            showVolumeHud(lastNonZeroVolume || 100);
        } else {
            setVolume(0);
            showVolumeHud(0);
        }
    }

    function setFitMode(mode) {
        currentFitMode = mode;
        const labels = {
            contain: 'Fit',
            cover: 'Fill',
            fill: 'Stretch',
            '16:9': '16:9',
            '21:9': '21:9',
            '4:3': '4:3'
        };

        if (mode === '16:9') {
            video.style.objectFit = 'fill';
            video.style.aspectRatio = '16 / 9';
        } else if (mode === '21:9') {
            video.style.objectFit = 'fill';
            video.style.aspectRatio = '21 / 9';
        } else if (mode === '4:3') {
            video.style.objectFit = 'fill';
            video.style.aspectRatio = '4 / 3';
        } else {
            video.style.aspectRatio = '';
            video.style.objectFit = mode;
        }

        const label = labels[mode] || mode;
        if ($('aspectVal')) $('aspectVal').textContent = label;
        document.querySelectorAll('#aspectQuickPills .ap-pill, #aspectPills .aspect-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.fit === mode);
        });

        showFitToast(label);
    }

    function cycleFitMode() {
        const modes = ['contain', 'cover', 'fill', '16:9', '21:9', '4:3'];
        const idx = modes.indexOf(currentFitMode);
        const next = modes[(idx + 1) % modes.length];
        setFitMode(next);
    }

    /* ==========================================================================
       10. FULLSCREEN & WAKE LOCK
       ========================================================================== */
    async function toggleFullscreen() {
        try {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (stage.requestFullscreen) {
                    await stage.requestFullscreen();
                } else if (stage.webkitRequestFullscreen) {
                    await stage.webkitRequestFullscreen();
                } else if (video.webkitEnterFullscreen) {
                    video.webkitEnterFullscreen();
                }
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                }
            }
        } catch (_) {}
    }

    function updateFsIcon() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (video && video.webkitDisplayingFullscreen));
        if ($('icoFsEnter')) $('icoFsEnter').style.display = isFs ? 'none' : 'block';
        if ($('icoFsExit')) $('icoFsExit').style.display = isFs ? 'block' : 'none';
    }

    /* ==========================================================================
       11. UI WAKE / AUTO-HIDE LOGIC
       ========================================================================== */
    function isOverlayOpen() {
        return (settingsDrawer && settingsDrawer.classList.contains('open')) ||
            ($('vlcModal') && $('vlcModal').classList.contains('open')) ||
            (volWrap && volWrap.classList.contains('open')) ||
            (aspectWrap && aspectWrap.classList.contains('open'));
    }

    // Item 16: Don't call glass resume/pause per mouse event; only on visibility transition
    function wakeUI(duration = 3500) {
        const wasHidden = stage.classList.contains('hide-ui');
        stage.classList.remove('hide-ui');
        stage.classList.remove('hide-cursor');
        if (wasHidden) resumeLiquidGlass();

        clearTimeout(wakeUiTimer);
        if (!video.paused && !isMouseOverUI && !isOverlayOpen()) {
            wakeUiTimer = setTimeout(() => {
                if (!isMouseOverUI && !isOverlayOpen() && !video.paused) {
                    stage.classList.add('hide-ui');
                    stage.classList.add('hide-cursor');
                    if (volWrap) volWrap.classList.remove('open');
                    if (aspectWrap) aspectWrap.classList.remove('open');
                    pauseLiquidGlass();
                }
            }, duration);
        }
    }

    /* ==========================================================================
       12. REWRITTEN GESTURE ENGINE (Strict e.pointerType Dispatch)
       ========================================================================== */
    // Item 6: Mouse single-click play immediately, double-click fullscreen.
    // Touch: single-tap toggle UI, double-tap left/right ∓10s, double-tap center play, hold 2x.
    const seekFxState = {
        L: { total: 0, timer: null },
        R: { total: 0, timer: null }
    };

    function triggerSeekFx(side) {
        const st = seekFxState[side];
        st.total += 10;
        const el = side === 'L' ? $('seekFxL') : $('seekFxR');
        const lbl = side === 'L' ? $('seekFxLblL') : $('seekFxLblR');
        if (lbl) lbl.textContent = `${side === 'L' ? '-' : '+'}${st.total}s`;

        if (Number.isFinite(video.duration) && video.duration > 0) {
            const delta = side === 'L' ? -10 : 10;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
            updateTimeDisplay();
        }

        if (el) {
            el.classList.remove('show');
            void el.offsetWidth;
            el.classList.add('show');
        }

        clearTimeout(st.timer);
        st.timer = setTimeout(() => {
            st.total = 0;
            if (el) el.classList.remove('show');
        }, 700);
    }

    function initPointerGestures() {
        stage.addEventListener('pointerdown', e => {
            // Ignore touches inside controls or overlays
            if (e.target.closest('#controls, #settingsDrawer, .modal-overlay, #landingScreen, #titleBar button')) return;

            const isTouch = e.pointerType === 'touch';
            if (isTouch) {
                try { stage.setPointerCapture(e.pointerId); } catch (_) {}
            }

            const stageRect = stage.getBoundingClientRect();
            const relX = (e.clientX - stageRect.left) / stageRect.width;
            let side = 'C';
            if (relX < 0.35) side = 'L';
            else if (relX > 0.65) side = 'R';

            gesture = {
                id: e.pointerId,
                type: e.pointerType,
                x0: e.clientX,
                y0: e.clientY,
                t0: Date.now(),
                side: side,
                moved: false,
                mode: null, // null | 'bri' | 'vol'
                startBri: fx.bri,
                startVol: video.volume * 100,
                holdTimer: null
            };

            // Hold detection for 2× speed (350 ms, must not move > 10px)
            gesture.holdTimer = setTimeout(() => {
                if (gesture && !gesture.moved && !gesture.mode && !video.paused && !video.ended) {
                    isHoldingSpeed = true;
                    video.playbackRate = 2.0;
                    showSpeedToast(2);
                    if (navigator.vibrate) {
                        try { navigator.vibrate(30); } catch (_) {}
                    }
                }
            }, 350);
        });

        // Throttle pointermove with requestAnimationFrame
        let moveRaf = null;
        stage.addEventListener('pointermove', e => {
            if (!gesture || gesture.id !== e.pointerId) {
                // Throttle desktop mouse hover wake
                if (e.pointerType === 'mouse' && !moveRaf) {
                    moveRaf = requestAnimationFrame(() => {
                        wakeUI();
                        moveRaf = null;
                    });
                }
                return;
            }

            const dx = e.clientX - gesture.x0;
            const dy = e.clientY - gesture.y0;
            const dist = Math.hypot(dx, dy);

            // Item 6: Cancel hold on move > 10px
            if (dist > 10 && gesture.holdTimer) {
                clearTimeout(gesture.holdTimer);
                gesture.holdTimer = null;
                gesture.moved = true;
            }

            if (isHoldingSpeed) return;

            // Touch vertical swipe detection (right half = brightness, left half = volume)
            if (gesture.type === 'touch' && Math.abs(dy) > 15 && Math.abs(dy) > Math.abs(dx) * 1.3) {
                if (!gesture.mode) {
                    if (gesture.side === 'R') gesture.mode = 'bri';
                    else if (gesture.side === 'L' && !isIOS) gesture.mode = 'vol';
                }

                if (gesture.mode === 'bri') {
                    const delta = -(dy / window.innerHeight) * 160;
                    fx.bri = Math.max(30, Math.min(200, Math.round(gesture.startBri + delta)));
                    applyFx();
                    showBrightnessHud(fx.bri);
                } else if (gesture.mode === 'vol') {
                    const delta = -(dy / window.innerHeight) * 100;
                    const v = Math.max(0, Math.min(100, Math.round(gesture.startVol + delta)));
                    setVolume(v);
                    showVolumeHud(v);
                }
            }
        });

        function endGesture(e) {
            if (!gesture || gesture.id !== e.pointerId) return;
            clearTimeout(gesture.holdTimer);

            if (isHoldingSpeed) {
                isHoldingSpeed = false;
                video.playbackRate = normalSpeed;
                showSpeedToast(normalSpeed);
                gesture = null;
                return;
            }

            if (gesture.mode) {
                try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
                gesture = null;
                return;
            }

            const dt = Date.now() - gesture.t0;
            const dist = Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0);

            if (dist < 10 && dt < 350) {
                if (gesture.type === 'mouse') {
                    // Mouse: Single click = togglePlay immediately (0ms delay!)
                    wakeUI();
                    togglePlay();
                } else {
                    // Touch: Handle double-tap vs single-tap
                    const now = Date.now();
                    const sinceLast = now - lastTapTime;
                    const isDoubleTap = sinceLast < 300 && lastTapSide === gesture.side;

                    if (isDoubleTap) {
                        clearTimeout(tapTimer);
                        tapTimer = null;
                        lastTapTime = 0;
                        lastTapSide = '';

                        if (gesture.side === 'L') {
                            triggerSeekFx('L');
                        } else if (gesture.side === 'R') {
                            triggerSeekFx('R');
                        } else {
                            togglePlay();
                        }
                    } else {
                        lastTapTime = now;
                        lastTapSide = gesture.side;
                        const side = gesture.side;
                        clearTimeout(tapTimer);
                        tapTimer = setTimeout(() => {
                            tapTimer = null;
                            // Touch: Single tap = toggle UI
                            if (stage.classList.contains('hide-ui')) {
                                wakeUI(3500);
                            } else {
                                stage.classList.add('hide-ui');
                                stage.classList.add('hide-cursor');
                                pauseLiquidGlass();
                            }
                        }, 280);
                    }
                }
            }

            try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
            gesture = null;
        }

        stage.addEventListener('pointerup', endGesture);
        stage.addEventListener('pointercancel', e => {
            if (gesture && gesture.id === e.pointerId) {
                clearTimeout(gesture.holdTimer);
                if (isHoldingSpeed) {
                    isHoldingSpeed = false;
                    video.playbackRate = normalSpeed;
                }
                gesture = null;
            }
        });

        // Mouse double click on stage = toggle fullscreen
        stage.addEventListener('dblclick', e => {
            if (e.target.closest('#controls, #settingsDrawer, .modal-overlay, #landingScreen')) return;
            toggleFullscreen();
        });
    }

    /* ==========================================================================
       13. KEYBOARD SHORTCUTS
       ========================================================================== */
    // Item 15: Ignore global Space/Enter when target is interactive, add :focus-visible
    function initKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.target && (
                e.target.matches('button, input, select, textarea, a, [contenteditable="true"]') ||
                e.target.closest('#settingsDrawer, .modal-overlay, #landingForm')
            )) {
                return;
            }

            const code = e.code;
            const key = e.key.toLowerCase();

            if (code === 'Space' || key === 'k') {
                e.preventDefault();
                togglePlay();
                wakeUI();
            } else if (key === 'f') {
                e.preventDefault();
                toggleFullscreen();
            } else if (key === 'm') {
                e.preventDefault();
                toggleMute();
            } else if (key === 'p') {
                e.preventDefault();
                togglePip();
            } else if (key === 'z') {
                e.preventDefault();
                cycleFitMode();
            } else if (code === 'ArrowLeft') {
                e.preventDefault();
                if (Number.isFinite(video.duration)) {
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    updateTimeDisplay();
                    wakeUI();
                }
            } else if (code === 'ArrowRight') {
                e.preventDefault();
                if (Number.isFinite(video.duration)) {
                    video.currentTime = Math.min(video.duration, video.currentTime + 5);
                    updateTimeDisplay();
                    wakeUI();
                }
            } else if (code === 'ArrowUp') {
                e.preventDefault();
                setVolume((video.volume * 100) + 5);
                showVolumeHud(video.volume * 100);
                wakeUI();
            } else if (code === 'ArrowDown') {
                e.preventDefault();
                setVolume((video.volume * 100) - 5);
                showVolumeHud(video.volume * 100);
                wakeUI();
            }
        });
    }

    /* ==========================================================================
       14. MEDIA METADATA PARSING: EBML (MKV) & ISO BMFF (MP4)
       ========================================================================== */
    function readAscii(buf, offset, length) {
        let str = '';
        const end = Math.min(buf.length, offset + length);
        for (let i = offset; i < end; i++) str += String.fromCharCode(buf[i]);
        return str;
    }

    function readUint(buf, offset, length) {
        let val = 0;
        for (let i = 0; i < length; i++) val = (val * 256) + buf[offset + i];
        return val;
    }

    function readVint(buf, offset) {
        if (offset >= buf.length) return null;
        const b = buf[offset];
        let mask = 0x80, len = 1;
        while (len <= 8 && !(b & mask)) {
            mask >>= 1;
            len++;
        }
        if (len > 8 || offset + len > buf.length) return null;
        let val = b & (mask - 1);
        for (let i = 1; i < len; i++) val = (val * 256) + buf[offset + i];
        return { length: len, value: val };
    }

    function readEbmlId(buf, offset) {
        if (offset >= buf.length) return null;
        const b = buf[offset];
        let mask = 0x80, len = 1;
        while (len <= 4 && !(b & mask)) {
            mask >>= 1;
            len++;
        }
        if (len > 4 || offset + len > buf.length) return null;
        let id = 0;
        for (let i = 0; i < len; i++) id = (id * 256) + buf[offset + i];
        return { length: len, id: id };
    }

    function readUtf8(buf, offset, length) {
        try {
            return new TextDecoder('utf-8', { fatal: false }).decode(buf.subarray(offset, offset + length)).trim();
        } catch (_) {
            return readAscii(buf, offset, length).trim();
        }
    }

    function resolveTrackLanguage(lang, fallback) {
        if (!lang) return fallback || 'Undetermined';
        const map = {
            eng: 'English', en: 'English',
            spa: 'Spanish', es: 'Spanish',
            fra: 'French', fre: 'French', fr: 'French',
            deu: 'German', ger: 'German', de: 'German',
            ita: 'Italian', it: 'Italian',
            jpn: 'Japanese', ja: 'Japanese',
            kor: 'Korean', ko: 'Korean',
            zho: 'Chinese', chi: 'Chinese', zh: 'Chinese',
            rus: 'Russian', ru: 'Russian',
            hin: 'Hindi', hi: 'Hindi',
            tam: 'Tamil', ta: 'Tamil',
            tel: 'Telugu', te: 'Telugu',
            mal: 'Malayalam', ml: 'Malayalam',
            kan: 'Kannada', kn: 'Kannada',
            ara: 'Arabic', ar: 'Arabic',
            por: 'Portuguese', pt: 'Portuguese'
        };
        const k = lang.toLowerCase().trim();
        return map[k] || lang.toUpperCase();
    }

    function parseEbmlTitle(buf) {
        let offset = 0;
        while (offset + 12 < buf.length) {
            const idInfo = readEbmlId(buf, offset);
            if (!idInfo) break;
            offset += idInfo.length;
            const sizeInfo = readVint(buf, offset);
            if (!sizeInfo) break;
            offset += sizeInfo.length;

            if (idInfo.id === 0x7ba9) { // Title Element ID
                return readUtf8(buf, offset, sizeInfo.value);
            }
            if (idInfo.id === 0x18538067 || idInfo.id === 0x1549a966) { // Segment or Info
                continue;
            }
            offset += sizeInfo.value;
        }
        return null;
    }

    function findEbmlSeekTracks(buf) {
        let offset = 0;
        while (offset + 12 < buf.length) {
            const idInfo = readEbmlId(buf, offset);
            if (!idInfo) break;
            offset += idInfo.length;
            const sizeInfo = readVint(buf, offset);
            if (!sizeInfo) break;
            offset += sizeInfo.length;

            if (idInfo.id === 0x114d9b74) { // SeekHead
                const headEnd = offset + sizeInfo.value;
                let sOff = offset;
                while (sOff + 8 < headEnd) {
                    const sId = readEbmlId(buf, sOff);
                    if (!sId) break;
                    sOff += sId.length;
                    const sSz = readVint(buf, sOff);
                    if (!sSz) break;
                    sOff += sSz.length;
                    if (sId.id === 0x4dbb) { // SeekEntry
                        const entryEnd = sOff + sSz.value;
                        let eOff = sOff;
                        let foundTracks = false;
                        let seekPos = 0;
                        while (eOff + 4 < entryEnd) {
                            const eId = readEbmlId(buf, eOff);
                            if (!eId) break;
                            eOff += eId.length;
                            const eSz = readVint(buf, eOff);
                            if (!eSz) break;
                            eOff += eSz.length;
                            if (eId.id === 0x53ab) { // SeekID
                                if (eSz.value === 4 && buf[eOff] === 0x16 && buf[eOff + 1] === 0x54 && buf[eOff + 2] === 0xae && buf[eOff + 3] === 0x6b) {
                                    foundTracks = true;
                                }
                            } else if (eId.id === 0x53ac) { // SeekPosition
                                seekPos = readUint(buf, eOff, eSz.value);
                            }
                            eOff += eSz.value;
                        }
                        if (foundTracks && seekPos > 0) return seekPos;
                    }
                    sOff += sSz.value;
                }
            }
            offset += sizeInfo.value;
        }
        return null;
    }

    // Item 10: Parse FlagDefault (0x88) for MKV default audio
    function parseEbmlTracks(buf) {
        let offset = 0;
        while (offset + 8 < buf.length) {
            const idInfo = readEbmlId(buf, offset);
            if (!idInfo) break;
            offset += idInfo.length;
            const sizeInfo = readVint(buf, offset);
            if (!sizeInfo) break;
            offset += sizeInfo.length;

            if (idInfo.id === 0x1654ae6b) { // Tracks Element
                const tracksEnd = offset + sizeInfo.value;
                const tracks = [];
                let tOff = offset;

                while (tOff + 4 < tracksEnd && tOff < buf.length) {
                    const entryId = readEbmlId(buf, tOff);
                    if (!entryId) break;
                    tOff += entryId.length;
                    const entrySize = readVint(buf, tOff);
                    if (!entrySize) break;
                    tOff += entrySize.length;

                    if (entryId.id === 0xae) { // TrackEntry
                        const eEnd = Math.min(tracksEnd, tOff + entrySize.value);
                        let sub = tOff;
                        let tType = 0, codecId = '', name = '', lang = '', isDefault = false;
                        let vWidth = 0, vHeight = 0, channels = 0, sampleRate = 0;

                        while (sub + 2 < eEnd && sub < buf.length) {
                            const subId = readEbmlId(buf, sub);
                            if (!subId) break;
                            sub += subId.length;
                            const subSz = readVint(buf, sub);
                            if (!subSz) break;
                            sub += subSz.length;

                            if (subId.id === 0x83) { // TrackType (1=video, 2=audio, 17=sub)
                                tType = readUint(buf, sub, subSz.value);
                            } else if (subId.id === 0x88) { // FlagDefault
                                isDefault = readUint(buf, sub, subSz.value) === 1;
                            } else if (subId.id === 0x86) { // CodecID
                                codecId = readAscii(buf, sub, subSz.value);
                            } else if (subId.id === 0x536e) { // Name
                                name = readUtf8(buf, sub, subSz.value);
                            } else if (subId.id === 0x22b59c) { // Language
                                lang = readAscii(buf, sub, subSz.value);
                            } else if (subId.id === 0xe0) { // Video Settings
                                const vEnd = Math.min(eEnd, sub + subSz.value);
                                let vSub = sub;
                                while (vSub + 2 < vEnd) {
                                    const vId = readEbmlId(buf, vSub);
                                    if (!vId) break;
                                    vSub += vId.length;
                                    const vSz = readVint(buf, vSub);
                                    if (!vSz) break;
                                    vSub += vSz.length;
                                    if (vId.id === 0xb0) vWidth = readUint(buf, vSub, vSz.value);
                                    else if (vId.id === 0xba) vHeight = readUint(buf, vSub, vSz.value);
                                    vSub += vSz.value;
                                }
                            } else if (subId.id === 0xe1) { // Audio Settings
                                const aEnd = Math.min(eEnd, sub + subSz.value);
                                let aSub = sub;
                                while (aSub + 2 < aEnd) {
                                    const aId = readEbmlId(buf, aSub);
                                    if (!aId) break;
                                    aSub += aId.length;
                                    const aSz = readVint(buf, aSub);
                                    if (!aSz) break;
                                    aSub += aSz.length;
                                    if (aId.id === 0x9f) channels = readUint(buf, aSub, aSz.value);
                                    else if (aId.id === 0xb5) sampleRate = Math.round(readUint(buf, aSub, aSz.value));
                                    aSub += aSz.value;
                                }
                            }
                            sub += subSz.value;
                        }

                        let codec = codecId.replace(/^A_|^V_/, '');
                        if (codec.includes('AAC')) codec = 'AAC';
                        else if (codec.includes('AC3')) codec = 'AC-3';
                        else if (codec.includes('EAC3')) codec = 'E-AC-3';
                        else if (codec.includes('DTS')) codec = 'DTS';
                        else if (codec.includes('OPUS')) codec = 'Opus';
                        else if (codec.includes('AVC')) codec = 'H.264/AVC';
                        else if (codec.includes('HEVC')) codec = 'H.265/HEVC';

                        if (tType === 1) {
                            tracks.push({
                                type: 'video',
                                codec: codec || 'Unknown',
                                width: vWidth,
                                height: vHeight
                            });
                        } else if (tType === 2) {
                            tracks.push({
                                type: 'audio',
                                codec: codec || 'Unknown',
                                name: name,
                                lang: resolveTrackLanguage(lang, name || 'Audio'),
                                isDefault: isDefault,
                                channels: channels ? (channels === 2 ? 'Stereo' : channels === 6 ? '5.1' : String(channels)) : '—',
                                sampleRate: sampleRate ? `${sampleRate} Hz` : '—',
                                bitRate: '—' // Honest: unknown without deeper frame scan
                            });
                        }
                    }
                    tOff += entrySize.value;
                }
                return tracks.length ? tracks : null;
            }
            offset += sizeInfo.value;
        }
        return null;
    }

    // Item 11: Fix MP4 parsing offsets (tkhd box+84 v0 / box+96 v1; mdhd box+28 v0 / box+40 v1)
    function parseMp4Tracks(buf) {
        if (buf.length < 32) return null;
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        let offset = 0;
        let moovOffset = -1, moovSize = 0;

        while (offset + 8 <= buf.length) {
            let size = view.getUint32(offset);
            const type = readAscii(buf, offset + 4, 4);
            if (size === 1 && offset + 16 <= buf.length) {
                size = Number(view.getBigUint64(offset + 8));
            }
            if (size < 8) break;
            if (type === 'moov') {
                moovOffset = offset + 8;
                moovSize = size - 8;
                break;
            }
            offset += size;
        }
        if (moovOffset === -1) return null;

        const tracks = [];
        const moovEnd = Math.min(buf.length, moovOffset + moovSize);
        offset = moovOffset;

        while (offset + 8 <= moovEnd) {
            const trakSize = view.getUint32(offset);
            const trakType = readAscii(buf, offset + 4, 4);
            if (trakSize < 8) break;

            if (trakType === 'trak') {
                const trakEnd = Math.min(moovEnd, offset + trakSize);
                let sub = offset + 8;
                let trackKind = '', codec = '', lang = '', vWidth = 0, vHeight = 0;

                while (sub + 8 <= trakEnd) {
                    const subSize = view.getUint32(sub);
                    const subType = readAscii(buf, sub + 4, 4);
                    if (subSize < 8) break;

                    // Verified ISO BMFF tkhd offset: width at box+84 (v0) / box+96 (v1)
                    if (subType === 'tkhd' && sub + 8 <= trakEnd) {
                        const ver = buf[sub + 8];
                        const wOff = ver === 1 ? sub + 96 : sub + 84;
                        if (wOff + 8 <= trakEnd) {
                            vWidth = view.getUint32(wOff) >> 16;
                            vHeight = view.getUint32(wOff + 4) >> 16;
                        }
                    } else if (subType === 'mdia') {
                        const mdiaEnd = Math.min(trakEnd, sub + subSize);
                        let mSub = sub + 8;
                        while (mSub + 8 <= mdiaEnd) {
                            const mSize = view.getUint32(mSub);
                            const mType = readAscii(buf, mSub + 4, 4);
                            if (mSize < 8) break;

                            if (mType === 'hdlr' && mSub + 20 <= mdiaEnd) {
                                const handler = readAscii(buf, mSub + 16, 4);
                                if (handler === 'soun') trackKind = 'audio';
                                else if (handler === 'vide') trackKind = 'video';
                            } else if (mType === 'mdhd' && mSub + 12 <= mdiaEnd) {
                                // Verified ISO BMFF mdhd offset: language at box+28 (v0) / box+40 (v1)
                                const ver = buf[mSub + 8];
                                const lOff = ver === 1 ? mSub + 40 : mSub + 28;
                                if (lOff + 2 <= mdiaEnd) {
                                    const packed = view.getUint16(lOff);
                                    const c1 = (packed >> 10) & 0x1f;
                                    const c2 = (packed >> 5) & 0x1f;
                                    const c3 = packed & 0x1f;
                                    if (c1 > 0 && c2 > 0 && c3 > 0) {
                                        const code = String.fromCharCode(c1 + 0x60, c2 + 0x60, c3 + 0x60);
                                        lang = resolveTrackLanguage(code, '');
                                    }
                                }
                            } else if (mType === 'minf') {
                                const minfEnd = Math.min(mdiaEnd, mSub + mSize);
                                let minfSub = mSub + 8;
                                while (minfSub + 8 <= minfEnd) {
                                    const sSize = view.getUint32(minfSub);
                                    const sType = readAscii(buf, minfSub + 4, 4);
                                    if (sSize < 8) break;
                                    if (sType === 'stbl') {
                                        const stblEnd = Math.min(minfEnd, minfSub + sSize);
                                        let stblSub = minfSub + 8;
                                        while (stblSub + 8 <= stblEnd) {
                                            const bSize = view.getUint32(stblSub);
                                            const bType = readAscii(buf, stblSub + 4, 4);
                                            if (bSize < 8) break;
                                            if (bType === 'stsd' && stblSub + 24 <= stblEnd) {
                                                const entryType = readAscii(buf, stblSub + 20, 4);
                                                if (entryType === 'avc1') codec = 'H.264/AVC';
                                                else if (entryType === 'hvc1' || entryType === 'hev1') codec = 'H.265/HEVC';
                                                else if (entryType === 'vp09') codec = 'VP9';
                                                else if (entryType === 'av01') codec = 'AV1';
                                                else if (entryType === 'mp4a') codec = 'AAC';
                                                else if (entryType === 'ac-3') codec = 'AC-3';
                                                else if (entryType === 'ec-3') codec = 'E-AC-3';
                                                else if (entryType === 'opus') codec = 'Opus';
                                            }
                                            stblSub += bSize;
                                        }
                                    }
                                    minfSub += sSize;
                                }
                            }
                            mSub += mSize;
                        }
                    }
                    sub += subSize;
                }

                if (trackKind === 'video') {
                    tracks.push({
                        type: 'video',
                        codec: codec || 'Unknown',
                        width: vWidth,
                        height: vHeight
                    });
                } else if (trackKind === 'audio') {
                    tracks.push({
                        type: 'audio',
                        codec: codec || 'Unknown',
                        name: lang || 'Audio Track',
                        lang: lang || 'Undetermined',
                        isDefault: tracks.filter(t => t.type === 'audio').length === 0,
                        channels: '—',
                        sampleRate: '—',
                        bitRate: '—'
                    });
                }
            }
            offset += trakSize;
        }

        return tracks.length ? tracks : null;
    }

    // Render Media Tracks and Badges with Sanitization
    function renderMediaTracks(tracks) {
        if (!tracks || !tracks.length) return;
        const videoTrack = tracks.find(t => t.type === 'video');
        const audioTracks = tracks.filter(t => t.type === 'audio');

        if (videoTrack) {
            mediaFileInfo.video.codec = videoTrack.codec || '—';
            if (videoTrack.width && videoTrack.height) {
                mediaFileInfo.video.width = videoTrack.width;
                mediaFileInfo.video.height = videoTrack.height;
            }
        }

        mediaFileInfo.audioTracks = audioTracks;
        mediaFileInfo.audioCount = audioTracks.length;
        updateMediaInfoDisplay();
    }

    function updateMediaInfoDisplay() {
        const grid = $('mediaInfoGrid');
        const pills = $('audioPills');
        const note = $('audioNote');
        const dlBadge = $('dlAudioBadge');
        const dlSummary = $('dlAudioSummary');

        // Resolution Badge
        const h = video.videoHeight || mediaFileInfo.video.height;
        const drRes = $('drResBadge');
        if (drRes) {
            if (h && h > 0) {
                const label = h >= 2160 ? '4K UHD' : h >= 1080 ? '1080p FHD' : h >= 720 ? '720p HD' : `${h}p`;
                drRes.textContent = '';
                const dot = document.createElement('span');
                dot.className = 'dot';
                drRes.appendChild(dot);
                drRes.appendChild(document.createTextNode(' ' + label));
                drRes.classList.add('show');
            } else {
                drRes.classList.remove('show');
            }
        }

        // Format Badge (MKV / MP4)
        const drFormat = $('drFormatBadge');
        if (drFormat) {
            if (mediaFileInfo.format) {
                drFormat.textContent = '';
                const dot = document.createElement('span');
                dot.className = 'dot';
                drFormat.appendChild(dot);
                const shortFmt = mediaFileInfo.format.includes('MKV') ? 'MKV' : mediaFileInfo.format.includes('MP4') ? 'MP4' : mediaFileInfo.format;
                drFormat.appendChild(document.createTextNode(' ' + shortFmt));
                drFormat.classList.add('show');
            } else {
                drFormat.classList.remove('show');
            }
        }

        // File Size Badge
        const drSize = $('drSizeBadge');
        if (drSize) {
            if (mediaFileInfo.fileSize && mediaFileInfo.fileSize !== '—') {
                drSize.textContent = '';
                const dot = document.createElement('span');
                dot.className = 'dot';
                drSize.appendChild(dot);
                drSize.appendChild(document.createTextNode(' ' + mediaFileInfo.fileSize));
                drSize.classList.add('show');
            } else {
                drSize.classList.remove('show');
            }
        }

        // Audio Count Badge
        const drAudio = $('drAudioBadge');
        const count = mediaFileInfo.audioCount;
        if (drAudio) {
            if (count > 0) {
                drAudio.textContent = '';
                const dot = document.createElement('span');
                dot.className = 'dot';
                drAudio.appendChild(dot);
                drAudio.appendChild(document.createTextNode(` ${count} ${count > 1 ? 'Audios' : 'Audio'}`));
                drAudio.classList.add('show');
            } else {
                drAudio.classList.remove('show');
            }
        }

        // Drawer Grid Generation
        if (grid) {
            grid.innerHTML = `
                <div class="mi-category">
                    <div class="mi-cat-header">🎥 Video Stream</div>
                    <div class="mi-row"><span class="mi-key">Resolution</span><span class="mi-val">${h ? `${h}p` : '—'}</span></div>
                    <div class="mi-row"><span class="mi-key">Codec</span><span class="mi-val">${escapeHtml(mediaFileInfo.video.codec || '—')}</span></div>
                    <div class="mi-row"><span class="mi-key">Container</span><span class="mi-val">${escapeHtml(mediaFileInfo.format || '—')}</span></div>
                    <div class="mi-row"><span class="mi-key">File Size</span><span class="mi-val">${escapeHtml(mediaFileInfo.fileSize || '—')}</span></div>
                </div>
            `;
        }

        // Audio Track Pills & Download Summary
        if (pills) pills.innerHTML = '';
        if (mediaFileInfo.audioTracks && mediaFileInfo.audioTracks.length > 0) {
            mediaFileInfo.audioTracks.forEach((t, i) => {
                if (pills) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `speed-pill ${i === 0 ? 'active' : ''}`;
                    btn.textContent = `${t.lang || t.name || 'Audio ' + (i + 1)} (${t.codec})`;
                    pills.appendChild(btn);
                }
            });

            if (note) {
                if (mediaFileInfo.audioTracks.length > 1) {
                    note.innerHTML = `Contains <strong>${mediaFileInfo.audioTracks.length} audio tracks</strong>. Browsers decode the default track (<strong>${escapeHtml(mediaFileInfo.audioTracks[0].lang || 'Track 1')}</strong>). Open in VLC for hardware multi-track audio switching.`;
                } else {
                    note.textContent = 'Primary audio stream active.';
                }
            }

            if (dlBadge) dlBadge.textContent = `${mediaFileInfo.audioTracks.length} Audios`;
            if (dlSummary) {
                const descs = mediaFileInfo.audioTracks.map(t => `${escapeHtml(t.lang || t.name || 'Track')} (${escapeHtml(t.codec)})`).join(', ');
                dlSummary.innerHTML = `<strong>Includes:</strong> ${descs}`;
            }
        }
    }

    // Item 9: inspectMediaMetadata respecting current mode, 256 KB Range GET, moov tail detection
    async function inspectMediaMetadata(url) {
        if (!url) return;
        const target = getEffectiveStreamUrl(url);

        try {
            // One request: 256 KB Range GET extracts headers and container bytes
            const signal = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
            const res = await fetch(target, {
                headers: { Range: 'bytes=0-262143' },
                signal
            });

            if (res.ok || res.status === 206) {
                // Parse Content-Disposition
                const cd = res.headers.get('Content-Disposition') || '';
                let filename = '';
                const mUtf = cd.match(/filename\*=UTF-8''([^";]+)/i);
                const mStd = cd.match(/filename="?([^";]+)"?/i);
                if (mUtf && mUtf[1]) filename = decodeURIComponent(mUtf[1]);
                else if (mStd && mStd[1]) filename = mStd[1];

                if (filename && !isOpaqueId(filename)) {
                    const clean = cleanTitleString(filename);
                    if (clean && !isOpaqueId(clean)) {
                        movieName.textContent = clean;
                        document.title = `${clean} · Stream Player Pro`;
                        lruSet('stream_title_cache', url, clean);
                    }
                }

                // File Size from Content-Range or Content-Length
                const cr = res.headers.get('Content-Range');
                const cl = res.headers.get('Content-Length');
                let totalBytes = 0;
                if (cr && cr.includes('/')) {
                    totalBytes = parseInt(cr.split('/')[1], 10);
                    if (!isNaN(totalBytes) && totalBytes > 0) {
                        mediaFileInfo.fileSize = formatBytes(totalBytes);
                    }
                } else if (cl) {
                    const b = parseInt(cl, 10);
                    if (!isNaN(b) && b > 262144) mediaFileInfo.fileSize = formatBytes(b);
                }

                // X-Audio-Tracks header
                const xTracks = res.headers.get('X-Audio-Tracks') || res.headers.get('X-Media-Tracks');
                if (xTracks) {
                    const items = xTracks.split(',').map(s => ({
                        type: 'audio',
                        name: s.trim(),
                        lang: s.trim(),
                        codec: 'Audio'
                    }));
                    renderMediaTracks(items);
                    return;
                }

                const buf = new Uint8Array(await res.arrayBuffer());

                // EBML (MKV) Header Check (0x1A 0x45 0xDF 0xA3)
                if (buf.length > 16 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
                    mediaFileInfo.format = 'Matroska (MKV)';
                    const title = parseEbmlTitle(buf);
                    if (title && !isOpaqueId(title)) {
                        const clean = cleanTitleString(title);
                        if (clean && !isOpaqueId(clean)) {
                            movieName.textContent = clean;
                            document.title = `${clean} · Stream Player Pro`;
                            lruSet('stream_title_cache', url, clean);
                        }
                    }

                    let tracks = parseEbmlTracks(buf);
                    if (!tracks) {
                        // Check SeekHead for exact Tracks offset
                        const seekOffset = findEbmlSeekTracks(buf);
                        if (seekOffset && seekOffset > 0) {
                            try {
                                const sRes = await fetch(target, {
                                    headers: { Range: `bytes=${seekOffset}-${seekOffset + 524287}` },
                                    signal
                                });
                                if (sRes.ok || sRes.status === 206) {
                                    const sBuf = new Uint8Array(await sRes.arrayBuffer());
                                    tracks = parseEbmlTracks(sBuf);
                                }
                            } catch (_) {}
                        } else {
                            // Widen to 2 MB only if Tracks not found in head
                            try {
                                const wRes = await fetch(target, {
                                    headers: { Range: 'bytes=262144-2097151' },
                                    signal
                                });
                                if (wRes.ok || wRes.status === 206) {
                                    const wBuf = new Uint8Array(await wRes.arrayBuffer());
                                    const combined = new Uint8Array(buf.length + wBuf.length);
                                    combined.set(buf, 0);
                                    combined.set(wBuf, buf.length);
                                    tracks = parseEbmlTracks(combined);
                                }
                            } catch (_) {}
                        }
                    }

                    if (tracks && tracks.length) {
                        renderMediaTracks(tracks);
                        return;
                    }
                }

                // MP4 Parsing
                let mp4Tracks = parseMp4Tracks(buf);
                if (!mp4Tracks && totalBytes > 524288) {
                    // Item 9: moov atom may be at the tail in non-faststart MP4s
                    try {
                        const tailStart = Math.max(0, totalBytes - 524288);
                        const tailRes = await fetch(target, {
                            headers: { Range: `bytes=${tailStart}-${totalBytes - 1}` },
                            signal
                        });
                        if (tailRes.ok || tailRes.status === 206) {
                            const tailBuf = new Uint8Array(await tailRes.arrayBuffer());
                            mp4Tracks = parseMp4Tracks(tailBuf);
                        }
                    } catch (_) {}
                }

                if (mp4Tracks && mp4Tracks.length) {
                    mediaFileInfo.format = 'MPEG-4 (MP4)';
                    renderMediaTracks(mp4Tracks);
                    return;
                }
            }
        } catch (_) {}

        updateMediaInfoDisplay();
    }

    /* ==========================================================================
       15. DIRECT STREAMING, MEDIA ERROR PROBING & AUTO-FALLBACK
       ========================================================================== */
    // Item 1: Direct streaming, no-cors fetch probe, specific messages, auto-fallback once
    async function handleMediaError() {
        hideSpinner(true);
        if (!video.paused && video.currentTime > 0.5) return;

        const originalUrl = streamUrl;
        const code = video.error ? video.error.code : 0;
        let reason = 'unknown';
        let detailMessage = 'Unable to play this media stream.';

        // Probe with fetch in no-cors mode to distinguish unreachable vs CORS vs codec
        try {
            const probeSignal = AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined;
            await fetch(originalUrl, { mode: 'no-cors', signal: probeSignal });
            // Probe resolved: host is reachable and returning bytes!
            if (code === 4 || code === 3) {
                reason = 'unsupported_codec';
                const lower = originalUrl.toLowerCase();
                const isSafariOrIos = isIOS || /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                if (lower.includes('.mkv') && isSafariOrIos) {
                    detailMessage = 'Safari and iOS cannot play MKV containers natively.';
                } else {
                    detailMessage = 'Browser cannot decode this video/audio codec (e.g. 10-bit HEVC, DTS, or AC-3).';
                }
            } else {
                reason = 'cors_blocked';
                detailMessage = 'Stream blocked by Cross-Origin Resource Sharing (CORS) or network firewall.';
            }
        } catch (fetchErr) {
            // Probe failed: network unreachable / offline / DNS failed
            reason = 'unreachable';
            detailMessage = 'Stream host is unreachable or connection dropped.';
        }

        lastReportedError = `${reason} (code ${code})`;

        // Auto-fallback once between direct and proxy on network or CORS failure
        if (!autoFallbackDone && (reason === 'unreachable' || reason === 'cors_blocked')) {
            autoFallbackDone = true;
            const resumePos = video.currentTime;
            useProxy = !useProxy;
            try { localStorage.setItem('stream_proxy_mode', String(useProxy)); } catch (_) {}
            updateProxyToggleUI();

            showToastHud({
                iconPath: useProxy ? ICON_FULL : ICON_SPEED,
                label: useProxy ? 'Auto-switching to Proxy…' : 'Auto-switching to Direct…',
                duration: 2000
            });

            loadStream(originalUrl, true, resumePos);
            return;
        }

        // Render specific error UI with Action buttons
        const actionBtn = useProxy
            ? `<button type="button" class="err-btn primary" id="errDirectBtn">⚡ Switch to Direct</button>`
            : `<button type="button" class="err-btn primary" id="errProxyBtn">🛡️ Retry via Proxy</button>`;

        errBox.innerHTML = `
            <span>⚠️ ${escapeHtml(detailMessage)}</span>
            <div class="err-actions">
                ${actionBtn}
                <button type="button" class="err-btn vlc" id="errVlcBtn">Open in VLC</button>
                <button type="button" class="err-btn close" id="errCloseBtn" title="Dismiss">✕</button>
            </div>
        `;
        errBox.style.display = 'flex';

        const bClose = $('errCloseBtn');
        if (bClose) bClose.onclick = () => { errBox.style.display = 'none'; };
        const bProxy = $('errProxyBtn');
        if (bProxy) {
            bProxy.onclick = () => {
                errBox.style.display = 'none';
                useProxy = true;
                try { localStorage.setItem('stream_proxy_mode', 'true'); } catch (_) {}
                updateProxyToggleUI();
                loadStream(originalUrl, true, video.currentTime);
            };
        }
        const bDirect = $('errDirectBtn');
        if (bDirect) {
            bDirect.onclick = () => {
                errBox.style.display = 'none';
                useProxy = false;
                try { localStorage.setItem('stream_proxy_mode', 'false'); } catch (_) {}
                updateProxyToggleUI();
                loadStream(originalUrl, true, video.currentTime);
            };
        }
        const bVlc = $('errVlcBtn');
        if (bVlc) {
            bVlc.onclick = () => openModal('vlcModal');
        }
    }

    /* ==========================================================================
       16. STREAM LOADING LIFECYCLE (AbortController Per Load)
       ========================================================================== */
    // Item 19: One AbortController per loadStream, dropped redundant video.load()
    function loadStream(url, tryAutoPlay = true, resumeFrom = 0) {
        streamUrl = (url || '').trim();
        if (!streamUrl) {
            showLanding();
            return;
        }

        if (loadStreamAbort) {
            loadStreamAbort.abort();
        }
        loadStreamAbort = new AbortController();
        const signal = loadStreamAbort.signal;

        showSpinner();
        if (errBox) errBox.style.display = 'none';

        // Item 17: Remove BOTH .on and .sticky on centerIcon so it never intercepts clicks
        centerIcon.classList.remove('on', 'sticky');
        centerIcon.style.display = 'flex';

        if (landingScreen) landingScreen.classList.remove('show');
        if ($('titleBar')) $('titleBar').style.display = 'flex';
        if ($('controls')) $('controls').style.display = 'flex';

        movieName.textContent = cleanTitleFromUrl(streamUrl);
        document.title = `${movieName.textContent} · Stream Player Pro`;

        // Item 1: Set crossorigin dynamically only when proxy is active, before setting src
        if (useProxy) {
            video.crossOrigin = 'anonymous';
        } else {
            video.removeAttribute('crossorigin');
        }

        const effectiveSrc = getEffectiveStreamUrl(streamUrl);
        video.src = effectiveSrc;

        // Resume position from parameter or LRU storage
        const targetResume = resumeFrom > 0 ? resumeFrom : parseFloat(lruGet('streamResume', streamUrl) || '0');
        const onLoadedMeta = () => {
            if (targetResume > 5 && Number.isFinite(video.duration) && targetResume < video.duration - 3) {
                video.currentTime = targetResume;
            }
            updateTimeDisplay();
            updateMediaInfoDisplay();
        };
        video.addEventListener('loadedmetadata', onLoadedMeta, { signal, once: true });

        // Autoplay handling
        if (tryAutoPlay) {
            const p = video.play();
            if (p && p.catch) {
                p.then(() => {
                    setPlayIcon();
                    if (video.readyState >= 3) hideSpinner();
                }).catch(err => {
                    if (err && err.name === 'AbortError') return;
                    setPlayIcon();
                    if (video.readyState >= 3) hideSpinner();
                    showCenter(D_PLAY, true);
                });
            }
        } else {
            const showPlayOnce = () => {
                if (video.paused && !video.ended) {
                    if (video.readyState >= 3) hideSpinner();
                    showCenter(D_PLAY, true);
                }
            };
            video.addEventListener('loadedmetadata', showPlayOnce, { signal, once: true });
            video.addEventListener('canplay', showPlayOnce, { signal, once: true });
        }

        // Trigger media metadata inspection
        inspectMediaMetadata(streamUrl);

        wakeUI();
        initLiquidGlass();
    }

    function showLanding() {
        streamUrl = '';
        if (landingScreen) landingScreen.classList.add('show');
        if ($('titleBar')) $('titleBar').style.display = 'none';
        if ($('controls')) $('controls').style.display = 'none';
        centerIcon.style.display = 'none';
        centerIcon.classList.remove('on', 'sticky');
        hideSpinner(true);
        try {
            video.pause();
            video.removeAttribute('src');
        } catch (_) {}
        destroyLiquidGlass();
    }

    /* ==========================================================================
       17. TIERED GLASS UI & PERFORMANCE GOVERNOR
       ========================================================================== */
    // Tier 0: CSS backdrop-filter only.
    // Tier 1: WebGL liquidGL on #controls only, with FPS governor.
    let liquidGlassLens = null;
    let liquidGlassEnabled = false;
    let fpsFrames = 0;
    let fpsStartTime = 0;
    let fpsGovernorDisabled = false;

    try {
        const storedTier = localStorage.getItem('stream_liquid_glass');
        liquidGlassEnabled = storedTier === 'true';
    } catch (_) {}

    function updateLiquidGlassToggleUI() {
        const btn = $('setLiquidGlass');
        if (btn) btn.classList.toggle('active', liquidGlassEnabled);
    }

    function initLiquidGlass() {
        if (!liquidGlassEnabled || typeof window.liquidGL !== 'function') {
            destroyLiquidGlass();
            return;
        }

        // Tier 1 Disabled on low-power devices, iOS, or small screens
        const isLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
            (navigator.deviceMemory && navigator.deviceMemory <= 4) || isIOS;
        if (isLowPower || fpsGovernorDisabled) {
            destroyLiquidGlass();
            return;
        }

        const controlsEl = $('controls');
        if (!controlsEl || controlsEl.offsetWidth <= 0 || controlsEl.offsetHeight <= 0) return;
        if (liquidGlassLens) return;

        try {
            controlsEl.classList.add('liquidgl-active');
            // Resolution capped at 1.0 for efficiency
            const res = 1.0;
            liquidGlassLens = window.liquidGL({
                target: '#controls',
                snapshot: '#stage',
                resolution: res,
                refraction: 0.02,
                aberration: 0.015,
                bevelDepth: 0.12,
                tint: [1, 1, 1, 0.04]
            });

            // FPS Governor: Measure first ~60 frames
            fpsFrames = 0;
            fpsStartTime = performance.now();
            let monitorRaf = null;

            const monitorLoop = () => {
                fpsFrames++;
                if (fpsFrames >= 60) {
                    const elapsed = performance.now() - fpsStartTime;
                    const avgFrameTime = elapsed / fpsFrames;
                    if (avgFrameTime > 20) { // < 50 FPS
                        fpsGovernorDisabled = true;
                        liquidGlassEnabled = false;
                        try { localStorage.setItem('stream_liquid_glass', 'false'); } catch (_) {}
                        updateLiquidGlassToggleUI();
                        destroyLiquidGlass();
                        showToastHud({
                            iconPath: ICON_SPEED,
                            label: 'Liquid Glass disabled for 60 FPS performance',
                            duration: 2500
                        });
                        return;
                    }
                } else if (liquidGlassLens) {
                    monitorRaf = requestAnimationFrame(monitorLoop);
                }
            };
            monitorRaf = requestAnimationFrame(monitorLoop);
        } catch (err) {
            destroyLiquidGlass();
        }
    }

    function destroyLiquidGlass() {
        const controlsEl = $('controls');
        if (controlsEl) controlsEl.classList.remove('liquidgl-active');
        if (liquidGlassLens) {
            try {
                if (typeof liquidGlassLens.destroy === 'function') liquidGlassLens.destroy();
            } catch (_) {}
            liquidGlassLens = null;
        }
    }

    function resumeLiquidGlass() {
        if (liquidGlassEnabled && window.liquidGL && window.liquidGL.resume) {
            try { window.liquidGL.resume(); } catch (_) {}
        }
    }

    function pauseLiquidGlass() {
        if (window.liquidGL && window.liquidGL.pause) {
            try { window.liquidGL.pause(); } catch (_) {}
        }
    }

    /* ==========================================================================
       18. MODALS & DRAWER EVENT WIRING
       ========================================================================== */
    function openDrawer() {
        settingsDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        wakeUI(10000);
    }

    function closeDrawer() {
        settingsDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
    }

    function openModal(id) {
        const m = $(id);
        if (m) m.classList.add('open');
        wakeUI(10000);
    }

    function closeModal(id) {
        const m = $(id);
        if (m) m.classList.remove('open');
    }

    function updateProxyToggleUI() {
        const btn = $('setProxy');
        if (btn) btn.classList.toggle('active', useProxy);
    }

    /* ==========================================================================
       19. DEBUG OVERLAY (?debug=1)
       ========================================================================== */
    let isDebugMode = false;
    let fpsMeterCount = 0;
    let fpsMeterTime = performance.now();
    let currentFpsDisplay = '—';

    function initDebugOverlay() {
        const p = new URLSearchParams(window.location.search);
        isDebugMode = p.get('debug') === '1' || p.get('debug') === 'true';
        if (isDebugMode && debugOverlay) {
            debugOverlay.classList.add('show');
            setInterval(updateDebugMetrics, 500);

            const calcFps = () => {
                fpsMeterCount++;
                const now = performance.now();
                if (now - fpsMeterTime >= 1000) {
                    currentFpsDisplay = Math.round((fpsMeterCount * 1000) / (now - fpsMeterTime)) + ' FPS';
                    fpsMeterCount = 0;
                    fpsMeterTime = now;
                }
                requestAnimationFrame(calcFps);
            };
            requestAnimationFrame(calcFps);
        }
    }

    function updateDebugMetrics() {
        if (!isDebugMode || !debugOverlay) return;
        $('dbgMode').textContent = useProxy ? 'Proxy' : 'Direct';
        $('dbgSrc').textContent = video.currentSrc || 'None';
        $('dbgReady').textContent = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState] || String(video.readyState);
        $('dbgNet').textContent = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'][video.networkState] || String(video.networkState);

        let bufRanges = [];
        if (video.buffered) {
            for (let i = 0; i < video.buffered.length; i++) {
                bufRanges.push(`[${video.buffered.start(i).toFixed(1)}–${video.buffered.end(i).toFixed(1)}s]`);
            }
        }
        $('dbgBuf').textContent = bufRanges.length ? bufRanges.join(', ') : 'None';
        $('dbgErr').textContent = lastReportedError || 'None';
        $('dbgFps').textContent = currentFpsDisplay;
    }

    /* ==========================================================================
       20. VLC HANDOFF BUILDER
       ========================================================================== */
    function buildVlcHref(url) {
        if (!url) return '';
        if (/android/i.test(navigator.userAgent)) {
            const scheme = url.startsWith('https') ? 'https' : 'http';
            const bare = url.replace(/^https?:\/\//, '');
            const fb = encodeURIComponent('https://play.google.com/store/apps/details?id=org.videolan.vlc');
            return `intent://${bare}#Intent;scheme=${scheme};package=org.videolan.vlc;S.browser_fallback_url=${fb};end`;
        }
        if (isIOS) {
            return `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(url)}`;
        }
        return `vlc://${url}`;
    }

    /* ==========================================================================
       21. INITIALIZATION & LIFECYCLE EVENT LISTENERS
       ========================================================================== */
    function setupEventListeners() {
        // Play / Pause Click
        playBtn.addEventListener('click', () => {
            togglePlay();
            wakeUI();
        });

        centerIcon.addEventListener('click', () => {
            if (centerIcon.classList.contains('sticky') || video.paused || video.ended) {
                togglePlay();
                wakeUI();
            }
        });

        // Time Label Click
        timeRemaining.addEventListener('click', () => {
            showRemainingTime = !showRemainingTime;
            updateTimeDisplay();
        });

        // Volume Button & Popups
        volBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (volWrap.classList.contains('open')) {
                toggleMute();
            } else {
                volWrap.classList.add('open');
            }
            wakeUI();
        });

        aspectBtn.addEventListener('click', e => {
            e.stopPropagation();
            aspectWrap.classList.toggle('open');
            wakeUI();
        });

        // Volume Popup Slider
        if (volTrack) {
            function handleVolTrackEvent(e) {
                const r = volTrack.getBoundingClientRect();
                const pct = Math.max(0, Math.min(100, (1 - (e.clientY - r.top) / r.height) * 100));
                setVolume(pct);
            }
            volTrack.addEventListener('pointerdown', e => {
                e.stopPropagation();
                try { volTrack.setPointerCapture(e.pointerId); } catch (_) {}
                handleVolTrackEvent(e);
            });
            volTrack.addEventListener('pointermove', e => {
                if (e.buttons) handleVolTrackEvent(e);
            });
        }

        // Aspect Ratio Quick Pills
        document.querySelectorAll('#aspectQuickPills .ap-pill, #aspectPills .aspect-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                setFitMode(btn.dataset.fit);
                if (aspectWrap) aspectWrap.classList.remove('open');
            });
        });

        // Picture-in-Picture
        pipBtn.addEventListener('click', async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else if (video.requestPictureInPicture) {
                    await video.requestPictureInPicture();
                } else if (video.webkitSetPresentationMode) {
                    video.webkitSetPresentationMode('picture-in-picture');
                }
            } catch (_) {}
        });

        // Fullscreen
        fsBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', () => {
            updateFsIcon();
            initLiquidGlass();
        });
        document.addEventListener('webkitfullscreenchange', () => {
            updateFsIcon();
            initLiquidGlass();
        });

        // Settings Drawer Triggers
        setBtn.addEventListener('click', e => {
            e.stopPropagation();
            openDrawer();
        });
        $('drawerClose').addEventListener('click', closeDrawer);
        drawerOverlay.addEventListener('click', closeDrawer);

        // Drawer Collapsible Sections
        document.querySelectorAll('.dr-row[data-expand]').forEach(row => {
            row.addEventListener('click', () => {
                const secId = row.dataset.expand;
                const sec = $(secId);
                const isOpen = sec.classList.contains('open');
                sec.classList.toggle('open', !isOpen);
                row.classList.toggle('expanded', !isOpen);
                row.setAttribute('aria-expanded', String(!isOpen));
            });
        });

        // Speed Pills in Drawer
        document.querySelectorAll('#speedPills .speed-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = parseFloat(btn.dataset.speed);
                video.playbackRate = spd;
                video.defaultPlaybackRate = spd;
                normalSpeed = spd;
            });
        });

        // Ratechange listener keeps UI in sync
        video.addEventListener('ratechange', () => {
            const spd = video.playbackRate;
            if ($('speedVal')) $('speedVal').textContent = `${spd}×`;
            document.querySelectorAll('#speedPills .speed-pill').forEach(p => {
                p.classList.toggle('active', parseFloat(p.dataset.speed) === spd);
            });
        });

        // Loop Toggle
        $('setLoop').addEventListener('click', () => {
            video.loop = !video.loop;
            $('setLoop').classList.toggle('active', video.loop);
            $('setLoop').setAttribute('aria-checked', String(video.loop));
            showToastHud({
                iconPath: ICON_SPEED,
                label: video.loop ? 'Loop Enabled' : 'Loop Disabled',
                duration: 1200
            });
        });

        // Proxy Toggle
        $('setProxy').addEventListener('click', () => {
            useProxy = !useProxy;
            try { localStorage.setItem('stream_proxy_mode', String(useProxy)); } catch (_) {}
            updateProxyToggleUI();
            if (streamUrl) {
                loadStream(streamUrl, !video.paused, video.currentTime);
            }
        });

        // Liquid Glass Toggle
        $('setLiquidGlass').addEventListener('click', () => {
            liquidGlassEnabled = !liquidGlassEnabled;
            try { localStorage.setItem('stream_liquid_glass', String(liquidGlassEnabled)); } catch (_) {}
            updateLiquidGlassToggleUI();
            if (liquidGlassEnabled) initLiquidGlass();
            else destroyLiquidGlass();
        });

        // Video Adjustments Inputs
        $('fBri').addEventListener('input', e => { fx.bri = +e.target.value; applyFx(); });
        $('fCon').addEventListener('input', e => { fx.con = +e.target.value; applyFx(); });
        $('fSat').addEventListener('input', e => { fx.sat = +e.target.value; applyFx(); });
        $('fHue').addEventListener('input', e => { fx.hue = +e.target.value; applyFx(); });
        $('bAdjReset').addEventListener('click', () => {
            Object.assign(fx, { bri: 100, con: 100, sat: 100, hue: 0 });
            applyFx();
        });

        // Reload Player Action
        const doReload = () => {
            if (streamUrl && video.currentTime > 2) {
                lruSet('streamResume', streamUrl, String(video.currentTime));
            }
            window.location.reload();
        };
        $('titleReloadBtn').addEventListener('click', doReload);
        $('setReload').addEventListener('click', doReload);

        // Open Another Stream Action
        $('setNewStream').addEventListener('click', () => {
            closeDrawer();
            showLanding();
            history.pushState(null, '', window.location.pathname);
        });

        // Download Link
        $('setDownload').addEventListener('click', e => {
            if (!streamUrl) e.preventDefault();
            else $('setDownload').href = getEffectiveStreamUrl(streamUrl);
        });

        // VLC Modal Trigger
        $('setVLC').addEventListener('click', () => {
            closeDrawer();
            const steps = [
                'Launch the VLC Media Player application.',
                'Select Media / File → Open Network Stream.',
                'Paste your direct media URL and start playback.'
            ];
            $('vlcSteps').innerHTML = steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
            const href = buildVlcHref(streamUrl);
            const vlcLaunch = $('vlcLaunch');
            if (vlcLaunch) {
                vlcLaunch.style.display = href ? 'inline-flex' : 'none';
                vlcLaunch.onclick = () => { if (href) window.location.href = href; };
            }
            const vlcInstall = $('vlcInstall');
            if (vlcInstall) {
                if (/android/i.test(navigator.userAgent)) {
                    vlcInstall.href = 'https://play.google.com/store/apps/details?id=org.videolan.vlc';
                    vlcInstall.textContent = 'Get VLC (Google Play)';
                } else if (isIOS) {
                    vlcInstall.href = 'https://apps.apple.com/app/vlc-media-player/id650377962';
                    vlcInstall.textContent = 'Get VLC (App Store)';
                } else {
                    vlcInstall.href = 'https://www.videolan.org/vlc/';
                    vlcInstall.textContent = 'Get VLC (Official Website)';
                }
            }
            $('vlcCopy').onclick = () => {
                navigator.clipboard.writeText(streamUrl).then(() => {
                    $('vlcCopyStatus').textContent = 'Stream link copied to clipboard!';
                    setTimeout(() => { $('vlcCopyStatus').textContent = ''; }, 2000);
                });
            };
            openModal('vlcModal');
        });

        // Copy Direct Link
        $('setDirect').addEventListener('click', () => {
            if (!streamUrl) return;
            const lbl = $('setDirectLbl');
            const shareUrl = `${window.location.origin}${window.location.pathname}?video=${encodeURIComponent(streamUrl)}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                lbl.textContent = 'Copied ✓';
                setTimeout(() => { lbl.textContent = 'Copy direct link'; }, 1600);
            });
        });

        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(b => {
            b.addEventListener('click', () => closeModal(b.dataset.close));
        });
        document.querySelectorAll('.modal-overlay').forEach(o => {
            o.addEventListener('click', e => {
                if (e.target === o) o.classList.remove('open');
            });
        });

        // Landing Screen Form
        $('landingForm').addEventListener('submit', () => {
            const val = ($('landingUrl') ? $('landingUrl').value : '').trim();
            if (val) {
                history.pushState(null, '', `?video=${encodeURIComponent(val)}`);
                loadStream(val, true);
            }
        });

        $('copyFormatBtn').addEventListener('click', () => {
            const t = `${window.location.origin}${window.location.pathname}?video=<STREAM_URL>`;
            navigator.clipboard.writeText(t).then(() => {
                $('copyFormatBtn').textContent = 'Copied ✓';
                setTimeout(() => { $('copyFormatBtn').textContent = 'Copy'; }, 1600);
            });
        });

        $('copyExampleBtn').addEventListener('click', () => {
            const ex = ($('exampleUrl') ? $('exampleUrl').textContent : '').trim();
            navigator.clipboard.writeText(ex).then(() => {
                $('copyExampleBtn').textContent = 'Copied ✓';
                setTimeout(() => { $('copyExampleBtn').textContent = 'Copy'; }, 1600);
            });
        });

        $('btnTryDemo').addEventListener('click', () => {
            const demo = 'https://vjs.zencdn.net/v/oceans.mp4';
            history.pushState(null, '', `?video=${encodeURIComponent(demo)}`);
            loadStream(demo, true);
        });

        // Media Event Listeners
        video.addEventListener('play', () => {
            setPlayIcon();
            wakeUI(3500);
        });
        video.addEventListener('pause', () => {
            setPlayIcon();
            wakeUI(5000);
        });
        video.addEventListener('durationchange', updateTimeDisplay);
        video.addEventListener('progress', updateTimeDisplay);
        video.addEventListener('canplay', () => {
            if (video.readyState >= 3) hideSpinner();
        });

        // Item 18: Debounced seeking spinner
        let seekSpinnerTimer = null;
        video.addEventListener('seeking', () => {
            clearTimeout(seekSpinnerTimer);
            seekSpinnerTimer = setTimeout(() => {
                if (video.seeking || video.readyState < 3) showSpinner();
            }, 150);
        });
        video.addEventListener('seeked', () => {
            clearTimeout(seekSpinnerTimer);
            hideSpinner();
        });

        video.addEventListener('waiting', showSpinner);
        video.addEventListener('playing', () => hideSpinner());

        // Item 20: Throttled resume writes on timeupdate instead of setInterval
        video.addEventListener('timeupdate', () => {
            updateTimeDisplay();
            const now = Date.now();
            if (streamUrl && video.currentTime > 5 && now - lastResumeWriteTime > 3500) {
                lastResumeWriteTime = now;
                lruSet('streamResume', streamUrl, String(video.currentTime));
            }
        });

        // Media Error Handling
        video.addEventListener('error', handleMediaError);

        // Controls Hover State
        $('controls').addEventListener('mouseenter', () => { isMouseOverUI = true; });
        $('controls').addEventListener('mouseleave', () => {
            isMouseOverUI = false;
            wakeUI();
        });

        // Window resize and orientation change
        window.addEventListener('resize', () => {
            initLiquidGlass();
        });

        // Popstate Navigation
        window.addEventListener('popstate', () => {
            const target = parseStreamUrlFromLocation();
            if (target) loadStream(target, true);
            else showLanding();
        });
    }

    /* ==========================================================================
       22. BOOTSTRAP INITIALIZATION
       ========================================================================== */
    function init() {
        initializeCapabilityHiding();
        initSeekBar();
        initPointerGestures();
        initKeyboard();
        setupEventListeners();
        updateProxyToggleUI();
        updateLiquidGlassToggleUI();
        initDebugOverlay();

        // Update landing domain box
        if ($('domainBase')) {
            $('domainBase').textContent = `${window.location.origin}${window.location.pathname}`;
        }

        // Service Worker Registration for PWA Shell
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }

        // Initial Stream Load
        const initialStream = parseStreamUrlFromLocation();
        if (initialStream) {
            loadStream(initialStream, true);
        } else {
            showLanding();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
