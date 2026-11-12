import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = process.env.PORT || 3001;

const SLOTS = [
  { slotIndex: 0, spawnPos: [-3.0, 1.05, 0.0], spawnYaw: 0, colorHex: 0x1b4332, colorName: 'Olive Green' },
  { slotIndex: 1, spawnPos: [3.0, 1.05, 0.0], spawnYaw: 0, colorHex: 0xd35400, colorName: 'Rescue Orange' },
  { slotIndex: 2, spawnPos: [-6.0, 1.05, 0.0], spawnYaw: 0, colorHex: 0xc2b280, colorName: 'Expedition Sand' },
  { slotIndex: 3, spawnPos: [6.0, 1.05, 0.0], spawnYaw: 0, colorHex: 0x2980b9, colorName: 'Glacier Blue' }
];

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

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const urlPath = decodeURIComponent(parsedUrl.pathname);

  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Safe path resolution inside DIST_DIR preventing path traversal
  const safeRelativePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let targetPath = path.join(DIST_DIR, safeRelativePath === '/' || safeRelativePath === '\\' ? 'index.html' : safeRelativePath);

  // If file doesn't exist or is a folder, fallback to index.html for SPA routing
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isAsset = urlPath.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(targetPath).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Off-Road 4x4 Co-op Server is running. Run `npm run build` to generate production client assets.');
});

const wss = new WebSocketServer({ server });

/**
 * @typedef {Object} ClientSession
 * @property {string} id
 * @property {string} room
 * @property {number} slotIndex
 * @property {Object} slot
 * @property {WebSocket} ws
 */

/** @type {Map<string, Map<string, ClientSession>>} */
const rooms = new Map();

let nextClientId = 1;

wss.on('connection', (ws) => {
  // Disable Nagle's algorithm for immediate low-latency packet delivery
  if (ws._socket) {
    ws._socket.setNoDelay(true);
  }

  const clientId = `p_${nextClientId++}_${Math.random().toString(36).substring(2, 6)}`;
  /** @type {ClientSession | null} */
  let currentSession = null;

  ws.on('message', (raw, isBinary) => {
    // 1. High-Performance Zero-Copy Binary Relay for vehicle transforms
    if (isBinary) {
      if (!currentSession) return;
      const roomMembers = rooms.get(currentSession.room);
      if (!roomMembers) return;
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
      const roomCode = (msg.room || 'default').toUpperCase().trim().slice(0, 16);
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, new Map());
      }
      const roomMembers = rooms.get(roomCode);

      if (roomMembers.size >= SLOTS.length) {
        ws.send(JSON.stringify({ type: 'room_full', room: roomCode }));
        return;
      }

      // Pick the lowest available slot index
      const occupiedSlots = new Set([...roomMembers.values()].map((s) => s.slotIndex));
      let assignedIndex = 0;
      for (let i = 0; i < SLOTS.length; i++) {
        if (!occupiedSlots.has(i)) {
          assignedIndex = i;
          break;
        }
      }

      const slotConfig = { id: clientId, ...SLOTS[assignedIndex] };
      currentSession = {
        id: clientId,
        room: roomCode,
        slotIndex: assignedIndex,
        slot: slotConfig,
        ws
      };

      roomMembers.set(clientId, currentSession);

      // Notify joining player
      const existingPeers = [...roomMembers.values()]
        .filter((s) => s.id !== clientId)
        .map((s) => s.slot);

      ws.send(
        JSON.stringify({
          type: 'init',
          self: slotConfig,
          peers: existingPeers,
          room: roomCode
        })
      );

      // Notify other peers in room
      const joinNotification = JSON.stringify({
        type: 'peer_joined',
        peer: slotConfig
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== clientId && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(joinNotification);
        }
      }
      return;
    }

    if (!currentSession) return;
    const roomMembers = rooms.get(currentSession.room);
    if (!roomMembers) return;

    if (msg.type === 'state') {
      const relayPayload = JSON.stringify({
        type: 'peer_state',
        id: currentSession.id,
        state: msg.state
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== currentSession.id && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(relayPayload);
        }
      }
    } else if (msg.type === 'respawn') {
      const respawnPayload = JSON.stringify({
        type: 'peer_respawn',
        id: currentSession.id,
        pos: msg.pos,
        yaw: msg.yaw
      });
      for (const [id, peerSession] of roomMembers) {
        if (id !== currentSession.id && peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(respawnPayload);
        }
      }
    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: msg.t }));
    }
  });

  const handleDisconnect = () => {
    if (!currentSession) return;
    const roomCode = currentSession.room;
    const roomMembers = rooms.get(roomCode);
    if (roomMembers) {
      roomMembers.delete(currentSession.id);
      const leaveNotification = JSON.stringify({
        type: 'peer_left',
        id: currentSession.id
      });
      for (const peerSession of roomMembers.values()) {
        if (peerSession.ws.readyState === WebSocket.OPEN) {
          peerSession.ws.send(leaveNotification);
        }
      }
      if (roomMembers.size === 0) {
        rooms.delete(roomCode);
      }
    }
    currentSession = null;
  };

  ws.on('close', handleDisconnect);
  ws.on('error', handleDisconnect);
});

server.listen(PORT, () => {
  console.log(`[Multiplayer Server] Listening on port ${PORT}`);
});
