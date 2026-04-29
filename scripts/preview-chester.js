#!/usr/bin/env node
// Boots a static server at the repo root and opens scripts/chester-2d5-preview.html
// in the default browser. No external dependencies.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGE = '/scripts/chester-2d5-preview.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(url).replace(/^([/\\])+/, '');
  const filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found: ' + url);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

const PORT = parseInt(process.env.PORT || '5174', 10);
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}${PAGE}`;
  console.log(`\n  Chester 2.5D preview:  ${url}\n  Press Ctrl+C to stop.\n`);
  const opener =
    process.platform === 'darwin' ? `open "${url}"` :
    process.platform === 'win32'  ? `start "" "${url}"` :
                                     `xdg-open "${url}"`;
  exec(opener, (err) => {
    if (err) console.log('  (could not auto-open browser — copy the URL above)');
  });
});
