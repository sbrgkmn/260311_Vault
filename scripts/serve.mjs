import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8011);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') { res.writeHead(302, { Location: '/serial/' }); res.end(); return; }
    const parts = pathname.split(/[\\/]/);
    if (parts.some(part => part.startsWith('.') || part === 'tmp' || part === 'node_modules')) { res.writeHead(403); res.end('Forbidden'); return; }
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(302, { Location: pathname + '/' }); res.end(); return; }
      file = path.join(file, 'index.html');
    }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400);
    res.end('Unable to serve this path.');
  }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Set PORT to another port and run npm start again.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Serial Vaults: http://127.0.0.1:${port}/serial/\nVariation atlas: http://127.0.0.1:${port}/serial/variations.html\nOriginal generator: http://127.0.0.1:${port}/index.html`));
