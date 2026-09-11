/**
 * Zero-dependency static file server for the VR Human Cell explorer.
 *
 *   node server.js  →  http://localhost:3000
 *
 * Binds to 0.0.0.0 so it works in containers / cloud previews.
 * The app is pure static files — any static host works just as well
 * (Python: `python3 -m http.server`, GitHub Pages, nginx, …).
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let path = normalize(join(ROOT, url));

  // Prevent path traversal outside the project root.
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end('403 Forbidden');
    return;
  }

  try {
    const s = statSync(path);
    if (s.isDirectory()) path = join(path, 'index.html');
    const file = statSync(path);
    res.writeHead(200, {
      'Content-Type': MIME[extname(path).toLowerCase()] || 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    if (req.method === 'HEAD') return void res.end();
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🧫 VR Human Cell running at http://localhost:${PORT}`);
});
