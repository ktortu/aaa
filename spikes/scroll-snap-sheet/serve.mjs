// Mini serveur statique SANS dépendance pour tester le prototype sur un
// appareil réel du réseau local (iPhone → http://<ip-du-poste>:4400).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const PORT = 4400;

createServer(async (req, res) => {
  const file = req.url === '/' || req.url === '' ? 'prototype.html' : req.url.slice(1);
  try {
    const body = await readFile(join(root, file));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('introuvable');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Prototype servi sur http://0.0.0.0:${PORT}/ (accessible depuis le LAN)`);
});
