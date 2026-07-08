const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { WebSocketServer } = require("ws");

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const secret = process.env.HERO_RUSH_SECRET || "hero-rush-dev-secret";
const db = new DatabaseSync(path.join(root, "hero-rush.db"));
const rooms = new Map();
let nextRoomId = 1000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".glb": "model/gltf-binary"
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nick TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0,
    upgrades TEXT NOT NULL DEFAULT '{}',
    selected_hero TEXT NOT NULL DEFAULT 'tank',
    wins INTEGER NOT NULL DEFAULT 0,
    matches INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    if (!token || !token.includes(".")) return null;
    const [payload, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return db.prepare("SELECT * FROM users WHERE id = ?").get(data.sub) || null;
  } catch {
    return null;
  }
}

function authUser(req) {
  const header = req.headers.authorization || "";
  return verifyToken(header.startsWith("Bearer ") ? header.slice(7) : "");
}

function publicUser(user) {
  return {
    id: user.id,
    nick: user.nick,
    email: user.email,
    coins: user.coins,
    upgrades: JSON.parse(user.upgrades || "{}"),
    selectedHero: user.selected_hero,
    wins: user.wins,
    matches: user.matches
  };
}

function safeHero(hero) {
  return ["tank", "ranger", "mage", "healer", "assassin", "support"].includes(hero) ? hero : "tank";
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/register") {
      const body = await readJson(req);
      const nick = String(body.nick || "").trim().slice(0, 18);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (nick.length < 2 || !email.includes("@") || password.length < 6) {
        return sendJson(res, 400, { error: "Введите ник, email и пароль от 6 символов." });
      }
      const { salt, hash } = hashPassword(password);
      try {
        const info = db.prepare("INSERT INTO users (nick, email, password_hash, salt) VALUES (?, ?, ?, ?)").run(nick, email, hash, salt);
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
        return sendJson(res, 201, { token: signToken(user.id), user: publicUser(user) });
      } catch {
        return sendJson(res, 409, { error: "Этот email уже зарегистрирован." });
      }
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readJson(req);
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(body.email || "").trim().toLowerCase());
      if (!user) return sendJson(res, 401, { error: "Неверный email или пароль." });
      const { hash } = hashPassword(String(body.password || ""), user.salt);
      if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.password_hash))) {
        return sendJson(res, 401, { error: "Неверный email или пароль." });
      }
      return sendJson(res, 200, { token: signToken(user.id), user: publicUser(user) });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      const user = authUser(req);
      if (!user) return sendJson(res, 401, { error: "Нужно войти в аккаунт." });
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/progress") {
      const user = authUser(req);
      if (!user) return sendJson(res, 401, { error: "Нужно войти в аккаунт." });
      const body = await readJson(req);
      const coins = Math.max(0, Math.min(999999, Number(body.coins ?? user.coins) || 0));
      const upgrades = JSON.stringify(body.upgrades && typeof body.upgrades === "object" ? body.upgrades : JSON.parse(user.upgrades || "{}"));
      const selectedHero = safeHero(body.selectedHero || user.selected_hero);
      const wins = Math.max(user.wins, Number(body.wins ?? user.wins) || 0);
      const matches = Math.max(user.matches, Number(body.matches ?? user.matches) || 0);
      db.prepare("UPDATE users SET coins = ?, upgrades = ?, selected_hero = ?, wins = ?, matches = ? WHERE id = ?")
        .run(coins, upgrades, selectedHero, wins, matches, user.id);
      const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      return sendJson(res, 200, { user: publicUser(fresh) });
    }

    if (req.method === "POST" && url.pathname === "/api/rooms") {
      const user = authUser(req);
      if (!user) return sendJson(res, 401, { error: "Нужно войти в аккаунт." });
      const room = createRoom();
      return sendJson(res, 200, { room: room.id });
    }

    if (req.method === "POST" && url.pathname === "/api/matchmake") {
      const user = authUser(req);
      if (!user) return sendJson(res, 401, { error: "Нужно войти в аккаунт." });
      const room = [...rooms.values()].find((item) => item.players.size < 6) || createRoom();
      return sendJson(res, 200, { room: room.id });
    }

    return sendJson(res, 404, { error: "API route not found." });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function createRoom(id = String(nextRoomId++)) {
  const room = { id, players: new Map(), startedAt: Date.now() };
  rooms.set(id, room);
  return room;
}

function getRoom(id) {
  return rooms.get(id) || createRoom(id);
}

function serveStatic(req, res, url) {
  const target = path.resolve(root, url.pathname === "/" ? "index.html" : `.${decodeURI(url.pathname)}`);
  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  return serveStatic(req, res, url);
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname !== "/ws") return socket.destroy();
  const user = verifyToken(url.searchParams.get("token"));
  if (!user) return socket.destroy();
  req.user = user;
  req.roomId = url.searchParams.get("room") || String(nextRoomId++);
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws, req) => {
  const user = req.user;
  const room = getRoom(req.roomId);
  const player = {
    id: String(user.id),
    nick: user.nick,
    hero: safeHero(user.selected_hero),
    x: 900 + Math.random() * 300,
    y: 600 + Math.random() * 220,
    vx: 0,
    vy: 0,
    input: { x: 0, y: 0 },
    connected: true,
    ws
  };
  room.players.set(player.id, player);
  ws.send(JSON.stringify({ type: "welcome", room: room.id, playerId: player.id }));
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "input") {
        const x = Math.max(-1, Math.min(1, Number(msg.x) || 0));
        const y = Math.max(-1, Math.min(1, Number(msg.y) || 0));
        const len = Math.hypot(x, y) || 1;
        player.input = len > 1 ? { x: x / len, y: y / len } : { x, y };
      }
      if (msg.type === "hero") player.hero = safeHero(msg.hero);
    } catch {
      // Ignore malformed packets.
    }
  });
  ws.on("close", () => {
    player.connected = false;
    setTimeout(() => {
      if (!player.connected) room.players.delete(player.id);
      if (room.players.size === 0) rooms.delete(room.id);
    }, 15000);
  });
});

setInterval(() => {
  const dt = 1 / 20;
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      const speed = 152;
      player.vx += (player.input.x * speed - player.vx) * 0.35;
      player.vy += (player.input.y * speed - player.vy) * 0.35;
      player.x = Math.max(25, Math.min(2075, player.x + player.vx * dt));
      player.y = Math.max(25, Math.min(1425, player.y + player.vy * dt));
    }
    const state = JSON.stringify({
      type: "state",
      room: room.id,
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        nick: p.nick,
        hero: p.hero,
        x: p.x,
        y: p.y,
        connected: p.connected
      }))
    });
    for (const player of room.players.values()) {
      if (player.ws.readyState === player.ws.OPEN) player.ws.send(state);
    }
  }
}, 50);

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/`);
});
