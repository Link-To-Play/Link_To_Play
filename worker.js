export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // Streaming proxy endpoint to bypass campus/restricted firewalls
        if (url.pathname === '/api/proxy') {
            let targetUrl = '';
            // Preserve full query parameters even if target has unencoded &
            const fullRaw = request.url;
            const qMatch = fullRaw.match(/[?&]url=([^$]+)/);
            if (qMatch) {
                targetUrl = qMatch[1];
                try { targetUrl = decodeURIComponent(targetUrl); } catch (e) {}
            }
            if (!targetUrl) {
                targetUrl = url.searchParams.get('url');
            }

            if (!targetUrl) {
                return new Response('Missing "url" query parameter', {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            let parsed;
            try {
                parsed = new URL(targetUrl);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    throw new Error('Invalid protocol');
                }
            } catch (e) {
                return new Response('Invalid target URL', {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            try {
                const reqHeaders = new Headers();
                // Pass byte range header through to upstream server
                const range = request.headers.get('Range');
                if (range) reqHeaders.set('Range', range);

                reqHeaders.set('User-Agent', request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
                reqHeaders.set('Accept', '*/*');
                // Prevent upstream compression from breaking byte ranges
                reqHeaders.set('Accept-Encoding', 'identity');
                reqHeaders.set('Referer', parsed.origin + '/');

                const upstreamRes = await fetch(parsed.toString(), {
                    method: request.method,
                    headers: reqHeaders,
                    redirect: 'follow'
                });

                const outHeaders = new Headers();
                // Copy critical media streaming headers
                const copyList = [
                    'content-type',
                    'content-length',
                    'content-range',
                    'accept-ranges',
                    'content-disposition',
                    'last-modified',
                    'etag'
                ];
                for (const key of copyList) {
                    const val = upstreamRes.headers.get(key);
                    if (val) outHeaders.set(key, val);
                }

                // Guarantee byte range support
                if (!outHeaders.has('accept-ranges')) {
                    outHeaders.set('accept-ranges', 'bytes');
                }

                outHeaders.set('X-Proxy-Upstream-Status', String(upstreamRes.status));

                // Permissive CORS so HTML5 video and fetch work unconditionally
                outHeaders.set('Access-Control-Allow-Origin', '*');
                outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                outHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With');
                outHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type, Content-Disposition, X-Proxy-Upstream-Status');

                return new Response(upstreamRes.body, {
                    status: upstreamRes.status,
                    statusText: upstreamRes.statusText,
                    headers: outHeaders
                });
            } catch (err) {
                return new Response(`Proxy error: ${err.message || 'Failed to fetch upstream stream'}`, {
                    status: 502,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        // Serve static assets (index.html, icons, manifest)
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};
