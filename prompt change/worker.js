/**
 * Cloudflare Worker: Stream Proxy and Static Asset Handler
 * Features:
 * - GET, HEAD, OPTIONS support
 * - Byte-range streaming with Content-Range (206 Partial Content)
 * - Upstream request cancellation on client abort
 * - Hardened SSRF protection (blocks loopback, private RFC1918, link-local, cloud metadata)
 * - Re-validated redirect follow up to 3 hops
 * - Permissive CORS headers for HTML5 video and metadata inspection
 * - Optional Origin allowlist & shared proxy token
 * - In-memory rate limiting per client IP
 */

const RATE_LIMIT_WINDOW_MS = 10000;
const RATE_LIMIT_MAX_REQUESTS = 80;
const ipRequestCounts = new Map();

function isRateLimited(clientIp) {
    if (!clientIp) return false;
    const now = Date.now();
    let entry = ipRequestCounts.get(clientIp);
    if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
        entry = { startTime: now, count: 1 };
        ipRequestCounts.set(clientIp, entry);
        if (ipRequestCounts.size > 5000) {
            for (const [k, v] of ipRequestCounts) {
                if (now - v.startTime > RATE_LIMIT_WINDOW_MS) ipRequestCounts.delete(k);
            }
        }
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function isPrivateOrLoopback(hostname) {
    if (!hostname) return true;
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' || lower.endsWith('.localhost') || lower === 'broadcasthost') return true;
    if (lower === '::1' || lower === '0.0.0.0') return true;

    // IPv4 check
    const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const [_, a, b, c, d] = ipv4Match.map(Number);
        if (a > 255 || b > 255 || c > 255 || d > 255) return true;
        if (a === 127) return true;                         // Loopback
        if (a === 10) return true;                          // Private 10.0.0.0/8
        if (a === 172 && b >= 16 && b <= 31) return true;   // Private 172.16.0.0/12
        if (a === 192 && b === 168) return true;            // Private 192.168.0.0/16
        if (a === 169 && b === 254) return true;            // Link-local / AWS metadata (169.254.169.254)
        if (a === 0) return true;                           // Current network
        if (a === 100 && b >= 64 && b <= 127) return true;  // Carrier-grade NAT
    }

    // IPv6 checks (link-local fe80::, unique-local fc00::/fd00::, loopback ::1)
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd') || lower === '::1') {
        return true;
    }

    return false;
}

function getCorsOrigin(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin) return '*';
    if (env && env.ALLOWED_ORIGINS) {
        const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
        return allowed.includes(origin) ? origin : allowed[0];
    }
    return '*';
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsOrigin = getCorsOrigin(request, env);

        // Standard CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // Only allow GET and HEAD for streaming proxy
        if (url.pathname === '/api/proxy') {
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                return new Response('Method Not Allowed', {
                    status: 405,
                    headers: {
                        'Allow': 'GET, HEAD, OPTIONS',
                        'Access-Control-Allow-Origin': corsOrigin
                    }
                });
            }

            // Optional shared token check
            if (env && env.PROXY_TOKEN) {
                const token = url.searchParams.get('token') || request.headers.get('X-Proxy-Token');
                if (token !== env.PROXY_TOKEN) {
                    return new Response('Unauthorized: Invalid proxy token', {
                        status: 401,
                        headers: { 'Access-Control-Allow-Origin': corsOrigin }
                    });
                }
            }

            // Client IP Rate Limiting
            const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
            if (isRateLimited(clientIp)) {
                return new Response('Too Many Requests', {
                    status: 429,
                    headers: {
                        'Retry-After': '10',
                        'Access-Control-Allow-Origin': corsOrigin
                    }
                });
            }

            // Extract target URL preserving unencoded '&' parameters in stream URL
            let targetUrl = '';
            const rawUrl = request.url;
            const qMatch = rawUrl.match(/[?&]url=([^#$]+)/);
            if (qMatch) {
                targetUrl = qMatch[1];
                if (/%[0-9a-fA-F]{2}/.test(targetUrl)) {
                    try { targetUrl = decodeURIComponent(targetUrl); } catch (_) {}
                }
            }
            if (!targetUrl) {
                targetUrl = url.searchParams.get('url');
            }

            if (!targetUrl) {
                return new Response('Missing "url" query parameter', {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': corsOrigin }
                });
            }

            let parsed;
            try {
                parsed = new URL(targetUrl);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    throw new Error('Invalid protocol: only http and https are permitted');
                }
            } catch (e) {
                return new Response(`Invalid target URL: ${e.message}`, {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': corsOrigin }
                });
            }

            // SSRF Protection
            if (isPrivateOrLoopback(parsed.hostname)) {
                return new Response('Access to private/loopback/metadata addresses is prohibited', {
                    status: 403,
                    headers: { 'Access-Control-Allow-Origin': corsOrigin }
                });
            }

            // Upstream Request Headers
            const reqHeaders = new Headers();
            const range = request.headers.get('Range');
            if (range) reqHeaders.set('Range', range);

            const ifRange = request.headers.get('If-Range');
            if (ifRange) reqHeaders.set('If-Range', ifRange);

            const ifNoneMatch = request.headers.get('If-None-Match');
            if (ifNoneMatch) reqHeaders.set('If-None-Match', ifNoneMatch);

            // Set browser user-agent and referer
            reqHeaders.set('User-Agent', request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            reqHeaders.set('Accept', '*/*');
            reqHeaders.set('Accept-Encoding', 'identity');
            reqHeaders.set('Referer', parsed.origin + '/');

            // Strip cookies / authorization from client before sending upstream
            reqHeaders.delete('cookie');
            reqHeaders.delete('authorization');

            try {
                // Follow up to 3 redirects manually and re-validate each hop against SSRF
                let currentUrl = parsed.toString();
                let redirectCount = 0;
                let upstreamRes = null;

                while (redirectCount <= 3) {
                    const currentParsed = new URL(currentUrl);
                    if (currentParsed.protocol !== 'http:' && currentParsed.protocol !== 'https:') {
                        return new Response('Invalid protocol on redirect', {
                            status: 400,
                            headers: { 'Access-Control-Allow-Origin': corsOrigin }
                        });
                    }
                    if (isPrivateOrLoopback(currentParsed.hostname)) {
                        return new Response('Redirect to private address blocked', {
                            status: 403,
                            headers: { 'Access-Control-Allow-Origin': corsOrigin }
                        });
                    }

                    const hopHeaders = new Headers(reqHeaders);
                    hopHeaders.set('Referer', currentParsed.origin + '/');

                    upstreamRes = await fetch(currentUrl, {
                        method: request.method,
                        headers: hopHeaders,
                        redirect: 'manual',
                        signal: request.signal
                    });

                    if ([301, 302, 303, 307, 308].includes(upstreamRes.status)) {
                        redirectCount++;
                        if (redirectCount > 3) {
                            return new Response('Too many redirects', {
                                status: 508,
                                headers: { 'Access-Control-Allow-Origin': corsOrigin }
                            });
                        }
                        const loc = upstreamRes.headers.get('Location');
                        if (!loc) break;
                        currentUrl = new URL(loc, currentUrl).toString();
                        continue;
                    }
                    break;
                }

                if (!upstreamRes) {
                    throw new Error('Failed to obtain upstream response');
                }

                // Response Headers
                const outHeaders = new Headers();
                const copyList = [
                    'content-type',
                    'content-length',
                    'content-range',
                    'accept-ranges',
                    'content-disposition',
                    'last-modified',
                    'etag',
                    'x-audio-tracks',
                    'x-media-tracks'
                ];
                for (const key of copyList) {
                    const val = upstreamRes.headers.get(key);
                    if (val) outHeaders.set(key, val);
                }

                // Fix octet-stream for video files if needed
                const ct = outHeaders.get('content-type') || '';
                const pathLower = parsed.pathname.toLowerCase();
                if (!ct || ct === 'application/octet-stream' || ct === 'binary/octet-stream') {
                    if (pathLower.endsWith('.mkv')) outHeaders.set('content-type', 'video/x-matroska');
                    else if (pathLower.endsWith('.mp4') || pathLower.endsWith('.m4v')) outHeaders.set('content-type', 'video/mp4');
                    else if (pathLower.endsWith('.webm')) outHeaders.set('content-type', 'video/webm');
                }

                // Guarantee byte range support indication
                if (!outHeaders.has('accept-ranges')) {
                    outHeaders.set('accept-ranges', 'bytes');
                }

                outHeaders.set('X-Proxy-Upstream-Status', String(upstreamRes.status));

                // CORS headers
                outHeaders.set('Access-Control-Allow-Origin', corsOrigin);
                outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                outHeaders.set('Access-Control-Allow-Headers', 'Range, If-Range, If-None-Match, Content-Type, Authorization, X-Requested-With');
                outHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type, Content-Disposition, X-Audio-Tracks, X-Media-Tracks, X-Proxy-Upstream-Status');

                // Return streaming body directly with client abort signal forwarded
                return new Response(upstreamRes.body, {
                    status: upstreamRes.status,
                    statusText: upstreamRes.statusText,
                    headers: outHeaders
                });

            } catch (err) {
                if (err.name === 'AbortError') {
                    return new Response(null, { status: 499 });
                }
                return new Response(`Proxy error: ${err.message || 'Failed to fetch upstream media stream'}`, {
                    status: 502,
                    headers: { 'Access-Control-Allow-Origin': corsOrigin }
                });
            }
        }

        // Serve static assets (index.html, player.css, player.js, liquidGL.js, icons, manifest)
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};
