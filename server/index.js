import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = process.env.PORT || 3001;

const PALETTE_NAMES = ['Coral Flare', 'Golden Ochre', 'Glacier Teal', 'Alpine Pine'];
const MAX_SLOTS = 64;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.css', '.wasm', '.json', '.svg']);
const BROTLI_OPTIONS = { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } };
const GZIP_OPTIONS = { level: 6 };

/**
 * In-memory cache of static files and pre-compressed variants to avoid
 * starving Node's libuv threadpool with repeated Brotli/Gzip compression.
 * @type {Map<string, { raw: Buffer, br?: Buffer, gzip?: Buffer }>}
 */
const assetCache = new Map();
/** @type {Map<string, Promise<Buffer>>} */
const inflightCompress = new Map();

function compressAsync(key, buf, encoding) {
  const cacheKey = `${key}:${encoding}`;
  const existing = inflightCompress.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise((resolve, reject) => {
    const cb = (err, out) => {
      inflightCompress.delete(cacheKey);
      if (err) reject(err);
      else resolve(out);
    };
    if (encoding === 'br') zlib.brotliCompress(buf, BROTLI_OPTIONS, cb);
    else zlib.gzip(buf, GZIP_OPTIONS, cb);
  });
  inflightCompress.set(cacheKey, promise);
  return promise;
}

async function getAssetEntry(targetPath) {
  let entry = assetCache.get(targetPath);
  if (!entry) {
    const raw = await fs.promises.readFile(targetPath);
    entry = { raw };
    assetCache.set(targetPath, entry);
  }
  return entry;
}

const server = http.createServer(async (req, res) => {
  let urlPath = '/';
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    urlPath = decodeURIComponent(parsedUrl.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Safe path resolution inside DIST_DIR preventing path traversal
  const relPath = path.posix.normalize('/' + urlPath).replace(/^\/+/, '');
  let targetPath = path.resolve(DIST_DIR, relPath || 'index.html');
  if (!targetPath.startsWith(DIST_DIR)) {
    targetPath = path.join(DIST_DIR, 'index.html');
  }

  // Fallback to index.html for SPA routing if not found or is directory
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isAsset = urlPath.startsWith('/assets/');
    const canCompress = COMPRESSIBLE_EXTS.has(ext);
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      ...(canCompress ? { Vary: 'Accept-Encoding' } : {})
    };

    try {
      const entry = await getAssetEntry(targetPath);
      const acceptEncoding = (req.headers['accept-encoding'] || '').toLowerCase();
      let payload = entry.raw;

      if (canCompress && acceptEncoding.includes('br')) {
        if (!entry.br) entry.br = await compressAsync(targetPath, entry.raw, 'br');
        payload = entry.br;
        headers['Content-Encoding'] = 'br';
      } else if (canCompress && acceptEncoding.includes('gzip')) {
        if (!entry.gzip) entry.gzip = await compressAsync(targetPath, entry.raw, 'gzip');
        payload = entry.gzip;
        headers['Content-Encoding'] = 'gzip';
      }

      headers['Content-Length'] = payload.length;
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : payload);
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Alpine Freeride Server running. Run `npm run build` to build client assets.');
});

const wss = new WebSocketServer({ server });

/**
 * @typedef {Object} SkierSession
 * @property {number} id
 * @property {string} room
 * @property {number} slotIndex
 * @property {number} paletteId
 * @property {string} paletteName
 * @property {WebSocket} ws
 */

/** @type {Map<string, Map<number, SkierSession>>} */
const rooms = new Map();

wss.on('connection', (ws) => {
  if (ws._socket) {
    ws._socket.setNoDelay(true);
  }

  /** @type {SkierSession | null} */
  let currentSession = null;

  ws.on('message', (raw, isBinary) => {
    // 1. High-Performance Zero-Copy 28-Byte Binary Relay for skier transforms @ 20Hz
    if (isBinary) {
      if (!currentSession) return;
      const roomMembers = rooms.get(currentSession.room);
      if (!roomMembers) return;

      // Stamp the sender's verified clientId at offset 0 if buffer matches 28B schema
      if (Buffer.isBuffer(raw) && raw.length >= 28) {
        raw.writeUInt8(currentSession.id, 0);
      }

      for (const [id, peerSession] of roomMembers) {
        if (id !== currentSession.id && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(raw, { binary: true });
        }
      }
      return;
    }

    // 2. Control Messages (JSON)
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'join') {
      const roomCode = (msg.room || 'default-resort').toUpperCase().trim().slice(0, 16);
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, new Map());
      }
      const roomMembers = rooms.get(roomCode);

      if (roomMembers.size >= MAX_SLOTS) {
        ws.send(JSON.stringify({ type: 'room_full', room: roomCode }));
        return;
      }

      // Pick the lowest available slot index (0 to 63)
      const occupiedSlots = new Set([...roomMembers.values()].map((s) => s.slotIndex));
      let assignedIndex = 0;
      for (let i = 0; i < MAX_SLOTS; i++) {
        if (!occupiedSlots.has(i)) {
          assignedIndex = i;
          break;
        }
      }

      const assignedId = assignedIndex + 1; // 1 to 64
      const paletteId = assignedIndex % PALETTE_NAMES.length;
      const paletteName = PALETTE_NAMES[paletteId];

      currentSession = {
        id: assignedId,
        room: roomCode,
        slotIndex: assignedIndex,
        paletteId,
        paletteName,
        ws
      };

      roomMembers.set(assignedId, currentSession);

      // Existing peers in this resort room
      const existingPeers = [...roomMembers.values()]
        .filter((s) => s.id !== assignedId)
        .map((s) => ({
          id: s.id,
          slotIndex: s.slotIndex,
          paletteId: s.paletteId,
          paletteName: s.paletteName
        }));

      // Notify joining player
      ws.send(
        JSON.stringify({
          type: 'init',
          self: {
            id: assignedId,
            slotIndex: assignedIndex,
            paletteId,
            paletteName
          },
          peers: existingPeers,
          room: roomCode
        })
      );

      // Notify other peers in room
      const joinNotification = JSON.stringify({
        type: 'peer_joined',
        peer: {
          id: assignedId,
          slotIndex: assignedIndex,
          paletteId,
          paletteName
        }
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== assignedId && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(joinNotification);
        }
      }
      return;
    }

    if (!currentSession) return;
    const roomMembers = rooms.get(currentSession.room);
    if (!roomMembers) return;

    if (msg.type === 'trick') {
      // Broadcast trick landing event to room
      const trickPayload = JSON.stringify({
        type: 'peer_trick',
        id: currentSession.id,
        name: msg.name,
        points: msg.points
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== currentSession.id && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(trickPayload);
        }
      }
    } else if (msg.type === 'respawn') {
      const respawnPayload = JSON.stringify({
        type: 'peer_respawn',
        id: currentSession.id,
        pos: msg.pos,
        heading: msg.heading
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== currentSession.id && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(respawnPayload);
        }
      }
    }
  });

  const cleanup = () => {
    if (!currentSession) return;
    const roomMembers = rooms.get(currentSession.room);
    if (roomMembers) {
      roomMembers.delete(currentSession.id);
      if (roomMembers.size === 0) {
        rooms.delete(currentSession.room);
      } else {
        const leaveNotification = JSON.stringify({
          type: 'peer_left',
          id: currentSession.id
        });
        for (const [, peerSession] of roomMembers) {
          if (peerSession.ws.readyState === WebSocket.OPEN) {
            peerSession.ws.send(leaveNotification);
          }
        }
      }
    }
    currentSession = null;
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

server.listen(PORT, () => {
  console.log(`Alpine Freeride 3D Server listening on port ${PORT}`);
});
