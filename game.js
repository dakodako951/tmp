const canvas = document.getElementById("gameCanvas");
let renderer;
let scene;
let camera3D;
let arenaGroup;
let dynamicGroup;
let effectGroup;
let textureLoader;

const screens = {
  auth: document.getElementById("auth"),
  menu: document.getElementById("menu"),
  game: document.getElementById("game"),
  results: document.getElementById("results")
};

const ui = {
  play: document.getElementById("playButton"),
  again: document.getElementById("againButton"),
  menu: document.getElementById("menuButton"),
  pause: document.getElementById("pauseButton"),
  timer: document.getElementById("timer"),
  gems: document.getElementById("gems"),
  coins: document.getElementById("coins"),
  squad: document.getElementById("squadBar"),
  heroSelect: document.getElementById("heroSelect"),
  shop: document.getElementById("shopItems"),
  wallet: document.getElementById("walletCoins"),
  resultTitle: document.getElementById("resultTitle"),
  victoryLogo: document.getElementById("victoryLogo"),
  placeLogo: document.getElementById("placeLogo"),
  rewardLine: document.getElementById("rewardLine"),
  scoreboard: document.getElementById("scoreboard"),
  joystick: document.getElementById("joystick"),
  stick: document.getElementById("stick"),
  authForm: document.getElementById("authForm"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  nickField: document.getElementById("nickField"),
  authNick: document.getElementById("authNick"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authError: document.getElementById("authError"),
  authSubmit: document.getElementById("authSubmit"),
  logout: document.getElementById("logoutButton"),
  accountName: document.getElementById("accountName"),
  accountWins: document.getElementById("accountWins"),
  quickMatch: document.getElementById("quickMatchButton"),
  createRoom: document.getElementById("createRoomButton"),
  joinRoom: document.getElementById("joinRoomButton"),
  roomCode: document.getElementById("roomCodeInput"),
  onlineStatus: document.getElementById("onlineStatus")
};

const heroes = [
  { id: "tank", name: "Булат", role: "танк", icon: "shield", portrait: "иконки персонажей/танк.jpg", color: "#2f80ed", hp: 180, damage: 11, range: 56, speed: 132, rarity: "common" },
  { id: "ranger", name: "Искра", role: "стрелок", icon: "target", portrait: "иконки персонажей/стрелок.jpg", color: "#f2994a", hp: 112, damage: 17, range: 145, speed: 150, rarity: "rare" },
  { id: "mage", name: "Мира", role: "маг", icon: "spark", portrait: "иконки персонажей/маг.jpg", color: "#9b51e0", hp: 102, damage: 21, range: 126, speed: 138, rarity: "epic" },
  { id: "healer", name: "Рунар", role: "лекарь", icon: "plus", portrait: "иконки персонажей/лекарь.jpg", color: "#27ae60", hp: 120, damage: 9, range: 116, speed: 145, rarity: "rare" },
  { id: "assassin", name: "Клык", role: "ассасин", icon: "blade", portrait: "иконки персонажей/ассасин.jpg", color: "#eb5757", hp: 104, damage: 24, range: 48, speed: 178, rarity: "epic" },
  { id: "support", name: "Нова", role: "саппорт", icon: "star", portrait: "иконки персонажей/саппорт.jpg", color: "#00a8a8", hp: 130, damage: 12, range: 112, speed: 152, rarity: "common" }
];

const heroLooks = {
  tank: { primary: 0xe1a21a, secondary: 0x1169d8, dark: 0x24282d, skin: 0xbfc7c9, hair: 0x474f54, boot: 0x20242a },
  ranger: { primary: 0x55ef35, secondary: 0x1f58ba, dark: 0x1b2228, skin: 0x6f4632, hair: 0xd8c27b, boot: 0x163f85 },
  mage: { primary: 0x252033, secondary: 0x7b6aa6, dark: 0x15131f, skin: 0xc89d7b, hair: 0xd8d2c4, boot: 0x2a1d18 },
  healer: { primary: 0x8a553d, secondary: 0xb88962, dark: 0x3b241d, skin: 0xd09b74, hair: 0x2d1d1a, boot: 0x3a2018 },
  assassin: { primary: 0x20242d, secondary: 0x5b2330, dark: 0x11151c, skin: 0xbfa08f, hair: 0x11151c, boot: 0x11151c },
  support: { primary: 0xf2eee4, secondary: 0x22242c, dark: 0x151821, skin: 0xe8c6a3, hair: 0x05070c, boot: 0x20242c }
};

const portraitImages = new Map();
heroes.forEach((hero) => {
  const image = new Image();
  image.src = encodeURI(hero.portrait);
  portraitImages.set(hero.id, image);
});

const upgrades = [
  { id: "boots", name: "Сапоги", desc: "+8% скорость", cost: 80 },
  { id: "blade", name: "Клинок", desc: "+10% урон", cost: 120 },
  { id: "armor", name: "Броня", desc: "+15% здоровье", cost: 140 }
];

const save = JSON.parse(localStorage.getItem("crystal-squad-save") || '{"coins":0,"upgrades":{}}');
let selectedHero = heroes[0].id;
let game = null;
let keys = new Set();
let joystick = { active: false, x: 0, y: 0, pointer: null };
const sceneObjects = new WeakMap();
const portraitTextures = new Map();
let authMode = "login";
let authToken = localStorage.getItem("hero-rush-token") || "";
let currentUser = null;
let onlineSocket = null;
let onlinePlayerId = "";
let onlineMode = false;
let remoteTeams = new Map();
const resultPlaceLogos = {
  2: "assets/place-2-transparent.png",
  3: "assets/place-3-transparent.png",
  4: "assets/place-4-transparent.png",
  5: "assets/place-5-transparent.png",
  6: "assets/place-6-transparent.png",
  7: "assets/place-7-transparent.png",
  8: "assets/place-8-transparent.png"
};

ui.placeLogo.addEventListener("error", () => {
  ui.placeLogo.hidden = true;
  ui.resultTitle.hidden = false;
});

function ensureThree() {
  if (renderer || !window.THREE) return;
  textureLoader = new THREE.TextureLoader();
  heroes.forEach((hero) => {
    const texture = textureLoader.load(encodeURI(hero.portrait));
    texture.colorSpace = THREE.SRGBColorSpace;
    portraitTextures.set(hero.id, texture);
  });

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setClearColor(0x8fdc75, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8fdc75, 1200, 2300);
  camera3D = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 1, 4000);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x4f8b54, 1.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-420, 720, 360);
  sun.castShadow = true;
  sun.shadow.camera.left = -1000;
  sun.shadow.camera.right = 1000;
  sun.shadow.camera.top = 1000;
  sun.shadow.camera.bottom = -1000;
  scene.add(sun);

  arenaGroup = new THREE.Group();
  dynamicGroup = new THREE.Group();
  effectGroup = new THREE.Group();
  scene.add(arenaGroup, dynamicGroup, effectGroup);
}

function to3X(x) {
  return x - game.world.width / 2;
}

function to3Z(y) {
  return y - game.world.height / 2;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
      else child.material.dispose();
    }
  });
}

function makeMat(color, roughness = 0.72, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function persist() {
  localStorage.setItem("crystal-squad-save", JSON.stringify(save));
  syncProgress();
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка сервера.");
  return data;
}

function setAuthMode(mode) {
  authMode = mode;
  ui.loginTab.classList.toggle("active", mode === "login");
  ui.registerTab.classList.toggle("active", mode === "register");
  ui.nickField.style.display = mode === "register" ? "grid" : "none";
  ui.authSubmit.textContent = mode === "register" ? "Создать аккаунт" : "Войти";
  ui.authError.textContent = "";
}

function applyUser(user) {
  currentUser = user;
  save.coins = user.coins || 0;
  save.upgrades = user.upgrades || {};
  selectedHero = user.selectedHero || selectedHero;
  ui.accountName.textContent = user.nick || "Игрок";
  ui.accountWins.textContent = user.wins || 0;
  renderMenu();
}

async function bootAuth() {
  setAuthMode("login");
  if (!authToken) return showScreen("auth");
  try {
    const data = await api("/api/me");
    applyUser(data.user);
    showScreen("menu");
  } catch {
    authToken = "";
    localStorage.removeItem("hero-rush-token");
    showScreen("auth");
  }
}

async function submitAuth(event) {
  event.preventDefault();
  try {
    ui.authError.textContent = "";
    const body = { email: ui.authEmail.value, password: ui.authPassword.value };
    if (authMode === "register") body.nick = ui.authNick.value;
    const data = await api(authMode === "register" ? "/api/register" : "/api/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
    authToken = data.token;
    localStorage.setItem("hero-rush-token", authToken);
    applyUser(data.user);
    showScreen("menu");
  } catch (error) {
    ui.authError.textContent = error.message;
  }
}

async function syncProgress(extra = {}) {
  if (!authToken || !currentUser) return;
  try {
    const data = await api("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        coins: save.coins,
        upgrades: save.upgrades,
        selectedHero,
        wins: currentUser.wins || 0,
        matches: currentUser.matches || 0,
        ...extra
      })
    });
    currentUser = data.user;
    ui.accountWins.textContent = currentUser.wins || 0;
  } catch {
    // Keep local progress if the server is temporarily unavailable.
  }
}

function logout() {
  disconnectOnline();
  authToken = "";
  currentUser = null;
  localStorage.removeItem("hero-rush-token");
  showScreen("auth");
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getHero(id) {
  return heroes.find((hero) => hero.id === id) || heroes[0];
}

function renderMenu() {
  ui.wallet.textContent = save.coins;
  ui.heroSelect.innerHTML = heroes.map((hero) => `
    <button class="hero-card ${hero.id === selectedHero ? "selected" : ""}" data-hero="${hero.id}">
      <span class="avatar-row">
        <span class="avatar portrait" style="background:${hero.color}">
          <img src="${hero.portrait}" alt="${hero.role}">
        </span>
        <span>
          <span class="hero-name">${hero.name}</span>
          <span class="hero-role">${hero.role} · ${hero.rarity}</span>
        </span>
      </span>
    </button>
  `).join("");

  ui.shop.innerHTML = upgrades.map((item) => {
    const owned = save.upgrades[item.id];
    return `
      <button class="shop-card" data-buy="${item.id}" ${owned ? "disabled" : ""}>
        <div class="shop-name">${owned ? "Куплено: " : ""}${item.name}</div>
        <div class="shop-desc">${item.desc} · ${owned ? "активно" : item.cost + " монет"}</div>
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-hero]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedHero = button.dataset.hero;
      renderMenu();
      syncProgress({ selectedHero });
      if (onlineSocket && onlineSocket.readyState === WebSocket.OPEN) {
        onlineSocket.send(JSON.stringify({ type: "hero", hero: selectedHero }));
      }
    });
  });

  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = upgrades.find((upgrade) => upgrade.id === button.dataset.buy);
      if (!item || save.upgrades[item.id] || save.coins < item.cost) return;
      save.coins -= item.cost;
      save.upgrades[item.id] = true;
      persist();
      renderMenu();
    });
  });
}

function makeUnit(heroId, x, y, owner, level = 1) {
  const hero = getHero(heroId);
  let hp = hero.hp * (1 + level * 0.16);
  if (owner === "player" && save.upgrades.armor) hp *= 1.15;
  return {
    type: "unit",
    heroId,
    owner,
    name: hero.name,
    role: hero.role,
    icon: hero.icon,
    portrait: hero.portrait,
    color: hero.color,
    x,
    y,
    vx: 0,
    vy: 0,
    faceAngle: 0,
    walkPhase: rand(0, Math.PI * 2),
    hp,
    maxHp: hp,
    damage: hero.damage * (1 + (level - 1) * 0.55) * (owner === "player" && save.upgrades.blade ? 1.1 : 1),
    range: hero.range,
    speed: hero.speed * (owner === "player" && save.upgrades.boots ? 1.08 : 1),
    level,
    radius: 15 + level * 2,
    cooldown: rand(0, 0.35),
    healTimer: 0
  };
}

function createGame() {
  const world = { width: 2100, height: 1450 };
  const chests = spawnChests(world);
  const pickups = spawnPickups(world);
  const player = {
    id: currentUser ? currentUser.nick : "Ты",
    isPlayer: true,
    x: world.width / 2,
    y: world.height / 2,
    gems: 0,
    coins: 0,
    alive: true,
    squad: [makeUnit(selectedHero, world.width / 2, world.height / 2, "player")]
  };

  const bots = Array.from({ length: 7 }, (_, index) => {
    const hero = heroes[(index + 1) % heroes.length];
    return {
      id: `Бот ${index + 1}`,
      isPlayer: false,
      x: rand(140, world.width - 140),
      y: rand(140, world.height - 140),
      gems: 0,
      coins: 0,
      alive: true,
      aiTimer: 0,
      target: null,
      squad: [makeUnit(hero.id, rand(140, world.width - 140), rand(140, world.height - 140), `bot${index}`)]
    };
  });

  return {
    world,
    player,
    teams: [player, ...bots],
    monsters: spawnMonsters(world),
    chests: addCenterChests(chests, world),
    pickups: addCenterPickups(pickups, world),
    obstacles: spawnObstacles(world),
    effects: [],
    camera: { x: player.x, y: player.y },
    timeLeft: 180,
    ended: false,
    paused: false,
    last: performance.now()
  };
}

function addCenterChests(chests, world) {
  chests.push(
    { x: world.width / 2 - 120, y: world.height / 2 - 70, radius: 18, hp: 28, opened: false },
    { x: world.width / 2 + 130, y: world.height / 2 + 80, radius: 18, hp: 28, opened: false }
  );
  return chests;
}

function addCenterPickups(pickups, world) {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    pickups.push({
      kind: i % 3 === 0 ? "gem" : "coin",
      x: world.width / 2 + Math.cos(angle) * 95,
      y: world.height / 2 + Math.sin(angle) * 75,
      value: 1,
      radius: i % 3 === 0 ? 11 : 10
    });
  }
  return pickups;
}

function spawnMonsters(world) {
  const monsters = [];
  for (let i = 0; i < 28; i++) {
    monsters.push({
      type: "monster",
      x: rand(90, world.width - 90),
      y: rand(90, world.height - 90),
      hp: 56,
      maxHp: 56,
      radius: 18,
      color: "#8a6d3b",
      damage: 9,
      range: 34,
      cooldown: rand(0, 1),
      gems: 2,
      coins: 5
    });
  }
  monsters.push({
    type: "boss",
    x: world.width * 0.5,
    y: 160,
    hp: 380,
    maxHp: 380,
    radius: 34,
    color: "#6f3fb5",
    damage: 22,
    range: 48,
    cooldown: 0,
    gems: 18,
    coins: 35
  });
  return monsters;
}

function spawnChests(world) {
  return Array.from({ length: 20 }, () => ({
    x: rand(80, world.width - 80),
    y: rand(90, world.height - 90),
    radius: 18,
    hp: 28,
    opened: false
  }));
}

function spawnPickups(world) {
  const pickups = [];
  for (let i = 0; i < 42; i++) pickups.push({ kind: "coin", x: rand(70, world.width - 70), y: rand(70, world.height - 70), value: 1, radius: 10 });
  for (let i = 0; i < 30; i++) pickups.push({ kind: "gem", x: rand(70, world.width - 70), y: rand(70, world.height - 70), value: 1, radius: 11 });
  for (let i = 0; i < 8; i++) pickups.push({ kind: "boost", x: rand(90, world.width - 90), y: rand(90, world.height - 90), value: 1, radius: 13 });
  return pickups;
}

function spawnObstacles(world) {
  const items = [];
  for (let i = 0; i < 28; i++) {
    items.push({
      x: rand(80, world.width - 80),
      y: rand(80, world.height - 80),
      w: rand(44, 86),
      h: rand(38, 72),
      kind: Math.random() > 0.55 ? "bush" : "rock"
    });
  }
  return items;
}

function buildArena3D() {
  arenaGroup.clear();
  dynamicGroup.clear();
  effectGroup.clear();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(game.world.width, game.world.height, 40, 28),
    makeMat(0x72c95f, 0.9, 0)
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  arenaGroup.add(ground);

  const borderMat = makeMat(0x4d9c55, 0.75, 0);
  const borderSize = 28;
  [
    [0, -game.world.height / 2, game.world.width, borderSize],
    [0, game.world.height / 2, game.world.width, borderSize],
    [-game.world.width / 2, 0, borderSize, game.world.height],
    [game.world.width / 2, 0, borderSize, game.world.height]
  ].forEach(([x, z, w, h]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 34, h), borderMat);
    wall.position.set(x, 17, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    arenaGroup.add(wall);
  });

  game.obstacles.forEach((item) => {
    const height = item.kind === "bush" ? 34 : 48;
    const geometry = item.kind === "bush"
      ? new THREE.SphereGeometry(Math.max(item.w, item.h) * 0.35, 12, 8)
      : new THREE.BoxGeometry(item.w, height, item.h);
    const mesh = new THREE.Mesh(geometry, makeMat(item.kind === "bush" ? 0x2f9f4f : 0x8b98a4, 0.82, 0));
    mesh.position.set(to3X(item.x), height / 2, to3Z(item.y));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    arenaGroup.add(mesh);
  });

  for (let x = -game.world.width / 2 + 80; x < game.world.width / 2; x += 160) {
    for (let z = -game.world.height / 2 + 80; z < game.world.height / 2; z += 160) {
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(9, 22, 5),
        makeMat(0x5ed46a, 0.9, 0)
      );
      tuft.position.set(x + rand(-18, 18), 11, z + rand(-18, 18));
      tuft.castShadow = true;
      arenaGroup.add(tuft);
    }
  }
}

function makeUnitMesh(unit, isPlayer) {
  const group = new THREE.Group();
  const look = heroLooks[unit.heroId] || heroLooks.tank;
  const baseColor = new THREE.Color(look.primary);
  const darkColor = baseColor.clone().multiplyScalar(0.62);
  const skinMat = makeMat(look.skin, 0.58, 0.03);
  const bootMat = makeMat(look.boot, 0.62, 0.04);

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(unit.radius * 0.52, unit.radius * 0.9, 5, 12),
    makeMat(look.primary, 0.55, 0.08)
  );
  torso.position.y = unit.radius * 1.18;
  torso.scale.set(1.08, 1, 0.72);
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(unit.radius * 0.48, 18, 14),
    skinMat
  );
  head.position.y = unit.radius * 2.18;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(unit.radius * 0.5, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
    makeMat(look.hair, 0.58, 0.04)
  );
  hair.position.y = unit.radius * 2.3;
  hair.castShadow = true;
  group.add(hair);

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(unit.radius * 0.055, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x17212b })
    );
    eye.position.set(side * unit.radius * 0.14, unit.radius * 2.22, unit.radius * 0.42);
    group.add(eye);
  });

  const chestIcon = makeHeroChestIcon(unit);
  chestIcon.position.set(0, unit.radius * 1.35, unit.radius * 0.45);
  group.add(chestIcon);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(unit.radius * 0.16, unit.radius * 0.72, 4, 8),
      makeMat(look.primary, 0.56, 0.07)
    );
    arm.position.set(side * unit.radius * 0.66, unit.radius * 1.18, 0);
    arm.rotation.z = side * 0.28;
    arm.castShadow = true;
    arm.userData.walkLimb = true;
    group.add(arm);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(unit.radius * 0.18, 10, 8),
      skinMat
    );
    hand.position.set(side * unit.radius * 0.82, unit.radius * 0.74, -unit.radius * 0.02);
    hand.castShadow = true;
    group.add(hand);

    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(unit.radius * 0.18, unit.radius * 0.62, 4, 8),
      makeMat(look.secondary, 0.62, 0.04)
    );
    leg.position.set(side * unit.radius * 0.25, unit.radius * 0.43, 0);
    leg.rotation.z = -side * 0.08;
    leg.castShadow = true;
    leg.userData.walkLimb = true;
    group.add(leg);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(unit.radius * 0.42, unit.radius * 0.18, unit.radius * 0.62),
      bootMat
    );
    foot.position.set(side * unit.radius * 0.25, unit.radius * 0.11, -unit.radius * 0.1);
    foot.castShadow = true;
    foot.receiveShadow = true;
    group.add(foot);
  });

  const feet = new THREE.Mesh(
    new THREE.CylinderGeometry(unit.radius * 0.86, unit.radius * 0.96, 5, 18),
    new THREE.MeshBasicMaterial({ color: 0x17212b, transparent: true, opacity: 0.14 })
  );
  feet.position.y = 2.5;
  feet.receiveShadow = true;
  group.add(feet);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(unit.radius * 0.9, 2.2, 6, 28),
    makeMat(isPlayer ? 0xffffff : 0x24313a, 0.45, 0.1)
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3;
  group.add(ring);

  const classBadge = new THREE.Mesh(
    new THREE.CircleGeometry(unit.radius * 0.28, 18),
    makeMat(isPlayer ? 0xffffff : 0x1f2b34, 0.4, 0.12)
  );
  classBadge.position.set(unit.radius * 0.5, unit.radius * 2.52, -unit.radius * 0.42);
  group.add(classBadge);

  addHeroLookDetails(group, unit, look);

  const barBack = new THREE.Mesh(new THREE.PlaneGeometry(unit.radius * 2, 4), new THREE.MeshBasicMaterial({ color: 0x21303a }));
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(unit.radius * 2, 4), new THREE.MeshBasicMaterial({ color: 0x5be37d }));
  barBack.position.set(0, unit.radius * 2.95, 0);
  bar.position.set(0, unit.radius * 2.96, 0.2);
  group.add(barBack, bar);
  group.userData = { hpBar: bar, hpMaxWidth: unit.radius * 2, billboards: [barBack, bar, classBadge], body: torso, limbs: [] };
  group.children.forEach((child) => {
    if (child.userData.walkLimb) {
      group.userData.limbs.push(child);
    }
  });
  return group;
}

function makeHeroChestIcon(unit) {
  const texture = portraitTextures.get(unit.heroId);
  const icon = new THREE.Mesh(
    new THREE.CircleGeometry(unit.radius * 0.24, 24),
    new THREE.MeshBasicMaterial({
      map: texture || null,
      color: texture ? 0xffffff : unit.color,
      side: THREE.DoubleSide
    })
  );
  return icon;
}

function addHeroLookDetails(group, unit, look) {
  const r = unit.radius;
  const parts = [];
  const mat = (color, roughness = 0.55, metalness = 0.05) => makeMat(color, roughness, metalness);
  const add = (mesh, x, y, z, rx = 0, ry = 0, rz = 0) => {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };

  if (unit.heroId === "tank") {
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.55, r * 0.38, r * 0.72), mat(look.primary, 0.45, 0.25)), 0, r * 1.45, r * 0.04);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.32, r * 1.0, r * 0.18), mat(look.secondary, 0.38, 0.22)), 0, r * 1.44, r * 0.48);
    add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 16, 10), mat(look.skin, 0.28, 0.18)), 0, r * 2.18, r * 0.18);
    add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.34, r * 1.0, 4), mat(look.primary, 0.42, 0.18)), 0, r * 2.38, -r * 0.45, Math.PI * 0.5, 0, Math.PI * 0.25);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.24, r * 0.9, r * 0.9), mat(look.dark, 0.5, 0.25)), -r * 0.92, r * 1.28, r * 0.05, 0, 0, 0.18);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.45, r * 0.58, r * 0.12), mat(0x12d7df, 0.22, 0.15)), 0, r * 1.54, r * 0.52);
  }

  if (unit.heroId === "ranger") {
    for (let i = -2; i <= 2; i++) {
      add(new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.075, r * 0.88, 4, 6), mat(look.hair, 0.7, 0.02)), i * r * 0.12, r * 2.44, -r * 0.32, 0.85, 0, i * 0.12);
    }
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.68, r * 0.12, r * 0.08), mat(0x8cff2e, 0.25, 0.05)), 0, r * 2.2, r * 0.47);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.62, r * 0.54, r * 0.2), mat(look.secondary, 0.42, 0.16)), -r * 0.9, r * 1.28, r * 0.26, 0, 0.28, 0.18);
    add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.08, r * 0.86, 12), mat(0x8cff2e, 0.25, 0.1)), -r * 1.12, r * 1.28, r * 0.54, Math.PI / 2, 0.2, 0);
    add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.5, r * 0.045, 6, 18), mat(0x80ff2f, 0.25, 0.12)), 0, r * 0.95, r * 0.15, Math.PI / 2);
  }

  if (unit.heroId === "mage") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.18, r * 0.1, 28), mat(look.dark, 0.72, 0.02)), 0, r * 2.48, 0);
    add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, r * 1.15, 28), mat(look.dark, 0.7, 0.02)), 0, r * 2.92, 0);
    add(new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.2, r * 0.72, 5, 8), mat(0xe8e0d4, 0.78, 0.01)), 0, r * 1.85, r * 0.47);
    add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.055, r * 0.055, r * 2.2, 10), mat(0x5b3a24, 0.6, 0.04)), r * 0.98, r * 1.45, r * 0.15, 0.18, 0, 0.05);
    add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 14, 10), new THREE.MeshBasicMaterial({ color: 0x77e9ff })), r * 1.08, r * 2.52, r * 0.04);
    add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.72, r * 1.2, 4), mat(look.primary, 0.74, 0.01)), 0, r * 0.94, -r * 0.18, 0, Math.PI / 4, 0);
  }

  if (unit.heroId === "healer") {
    add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, r * 0.16, 8, 20), mat(0x6b5849, 0.86, 0.01)), 0, r * 1.72, 0, Math.PI / 2);
    add(new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.26, r * 0.78, 5, 8), mat(look.hair, 0.8, 0.01)), 0, r * 1.82, r * 0.43);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.98, r * 0.18, r * 0.2), mat(0x5a2f22, 0.62, 0.03)), 0, r * 1.18, r * 0.48);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.44, r * 0.16), mat(look.secondary, 0.74, 0.01)), 0, r * 0.92, r * 0.44);
    add(new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.18, r * 0.66, 4, 8), mat(0x7d3f31, 0.62, 0.03)), r * 0.88, r * 1.0, r * 0.18, 0.1, 0, -0.36);
  }

  if (unit.heroId === "assassin") {
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.88, r * 0.34, r * 0.08), mat(0x11151c, 0.6, 0.02)), 0, r * 2.14, r * 0.49);
    add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.76, r * 1.15, 4), mat(look.dark, 0.78, 0.01)), 0, r * 0.94, -r * 0.26, 0, Math.PI / 4, 0);
    [-1, 1].forEach((side) => {
      add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.13, r * 0.92, r * 0.08), mat(0xd8dde4, 0.35, 0.35)), side * r * 0.95, r * 0.72, r * 0.35, 0, 0, side * 0.45);
      add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.44, r * 0.12, r * 0.1), mat(0x5b2330, 0.48, 0.08)), side * r * 0.5, r * 1.28, r * 0.5);
    });
  }

  if (unit.heroId === "support") {
    add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.58, 20, 14), mat(0xf2eee4, 0.42, 0.08)), 0, r * 2.18, 0);
    add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 20, 10), new THREE.MeshBasicMaterial({ color: 0x11151c })), 0, r * 2.22, r * 0.23);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.0, r * 0.95, r * 0.28), mat(0xf2eee4, 0.48, 0.07)), 0, r * 1.18, -r * 0.08);
    add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.76, r * 0.82, r * 0.22), mat(0x252934, 0.52, 0.08)), 0, r * 1.24, -r * 0.5);
    add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.025, r * 0.025, r * 0.75, 8), mat(0x11151c, 0.38, 0.15)), r * 0.44, r * 2.72, -r * 0.1, 0.2);
    add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0x13c7d4 })), r * 0.5, r * 3.06, -r * 0.13);
  }

  group.userData.detailParts = parts;
}

function makePickupMesh(pickup) {
  let mesh;
  if (pickup.kind === "gem") {
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(12), makeMat(0x13c7d4, 0.32, 0.28));
  } else if (pickup.kind === "boost") {
    const group = new THREE.Group();
    const orb = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12), makeMat(0xffffff, 0.38, 0.05));
    const v = new THREE.Mesh(new THREE.BoxGeometry(5, 24, 5), makeMat(0xff5d5d, 0.45, 0.05));
    const h = new THREE.Mesh(new THREE.BoxGeometry(22, 5, 5), makeMat(0xff5d5d, 0.45, 0.05));
    group.add(orb, v, h);
    mesh = group;
  } else {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 4, 24), makeMat(0xffca3a, 0.28, 0.42));
    mesh.rotation.x = Math.PI / 2;
  }
  mesh.castShadow = true;
  return mesh;
}

function makeChestMesh() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(38, 24, 30), makeMat(0x9f642f, 0.62, 0.02));
  const band = new THREE.Mesh(new THREE.BoxGeometry(42, 7, 34), makeMat(0xffca3a, 0.35, 0.25));
  base.position.y = 12;
  band.position.y = 18;
  base.castShadow = true;
  band.castShadow = true;
  group.add(base, band);
  return group;
}

function makeMonsterMesh(monster) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(monster.radius, 18, 14),
    makeMat(monster.color, 0.64, 0.03)
  );
  body.position.y = monster.radius;
  body.castShadow = true;
  group.add(body);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-0.35, 0.35].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(monster.radius * 0.16, 8, 6), eyeMat);
    eye.position.set(monster.radius * side, monster.radius * 1.18, -monster.radius * 0.72);
    group.add(eye);
  });
  return group;
}

function startMatch() {
  onlineMode = false;
  disconnectOnline();
  ensureThree();
  game = createGame();
  buildArena3D();
  showScreen("game");
  resizeCanvas();
  requestAnimationFrame(loop);
}

async function startOnlineMatch(roomCode) {
  onlineMode = true;
  ensureThree();
  game = createGame();
  buildArena3D();
  showScreen("game");
  resizeCanvas();
  connectOnline(roomCode);
  requestAnimationFrame(loop);
}

function connectOnline(roomCode) {
  disconnectOnline();
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({ token: authToken, room: roomCode });
  onlineSocket = new WebSocket(`${protocol}//${location.host}/ws?${params.toString()}`);
  onlineSocket.addEventListener("open", () => {
    ui.onlineStatus.textContent = `Комната ${roomCode}`;
    onlineSocket.send(JSON.stringify({ type: "hero", hero: selectedHero }));
  });
  onlineSocket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "welcome") {
      onlinePlayerId = message.playerId;
      ui.onlineStatus.textContent = `Комната ${message.room}`;
    }
    if (message.type === "state") applyOnlineState(message);
  });
  onlineSocket.addEventListener("close", () => {
    ui.onlineStatus.textContent = "Оффлайн";
  });
}

function disconnectOnline() {
  if (onlineSocket) onlineSocket.close();
  onlineSocket = null;
  onlinePlayerId = "";
  remoteTeams.clear();
}

function sendOnlineInput() {
  if (!onlineSocket || onlineSocket.readyState !== WebSocket.OPEN) return;
  const vector = inputVector();
  onlineSocket.send(JSON.stringify({ type: "input", x: vector.x, y: vector.y }));
}

function applyOnlineState(state) {
  if (!game) return;
  const seen = new Set();
  state.players.forEach((player) => {
    if (player.id === onlinePlayerId) return;
    seen.add(player.id);
    let team = remoteTeams.get(player.id);
    if (!team) {
      const hero = getHero(player.hero);
      team = {
        id: player.nick,
        isPlayer: false,
        isRemote: true,
        x: player.x,
        y: player.y,
        gems: 0,
        coins: 0,
        alive: true,
        squad: [makeUnit(hero.id, player.x, player.y, `remote-${player.id}`)]
      };
      remoteTeams.set(player.id, team);
      game.teams.push(team);
    }
    team.id = player.nick;
    team.alive = player.connected !== false;
    const unit = team.squad[0];
    if (unit) {
      unit.x += (player.x - unit.x) * 0.35;
      unit.y += (player.y - unit.y) * 0.35;
      team.x = unit.x;
      team.y = unit.y;
    }
  });
  for (const [id, team] of remoteTeams) {
    if (seen.has(id)) continue;
    game.teams = game.teams.filter((item) => item !== team);
    remoteTeams.delete(id);
  }
}

function resizeCanvas() {
  if (!renderer || !camera3D) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera3D.aspect = window.innerWidth / window.innerHeight;
  camera3D.updateProjectionMatrix();
}

function inputVector() {
  let x = joystick.x;
  let y = joystick.y;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) x -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) x += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) y -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) y += 1;
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}

function loop(now) {
  if (!game || game.ended) return;
  const dt = Math.min((now - game.last) / 1000, 0.033);
  game.last = now;
  if (!game.paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  game.timeLeft -= dt;
  if (game.timeLeft <= 0 || !game.player.alive) return endMatch();

  if (onlineMode) sendOnlineInput();
  updateTeams(dt);
  updateMonsters(dt);
  collectPickups();
  openChests();
  cleanupDead();
  updateHud();
}

function updateTeams(dt) {
  const vector = inputVector();
  updateTeamLeader(game.player, vector, dt);
  const playerLeader = game.player.squad[0];
  const moving = playerLeader ? Math.hypot(playerLeader.vx, playerLeader.vy) > 10 : false;

  game.teams.forEach((team) => {
    if (!team.alive) return;
    if (team.isRemote) return;
    if (!team.isPlayer) updateBot(team, dt);
    followSquad(team, dt);
    team.squad.forEach((unit) => updateUnitCombat(team, unit, moving && team.isPlayer, dt));
    const leader = team.squad[0];
    if (leader) {
      team.x = leader.x;
      team.y = leader.y;
    }
  });
}

function updateTeamLeader(team, vector, dt) {
  const leader = team.squad[0];
  if (!leader) return;
  moveUnitSmooth(leader, vector, dt, 11, 13);
}

function updateBot(team, dt) {
  team.aiTimer -= dt;
  if (team.aiTimer <= 0 || !team.target) {
    team.aiTimer = rand(0.8, 1.7);
    team.target = pickBotTarget(team);
  }
  const leader = team.squad[0];
  if (!leader || !team.target) return;
  const dx = team.target.x - leader.x;
  const dy = team.target.y - leader.y;
  const length = Math.hypot(dx, dy) || 1;
  const cautious = team.target.squad && team.target.squad.length > team.squad.length + 1;
  const dir = cautious ? -1 : 1;
  const avoid = botAvoidanceVector(leader);
  const intent = normalizeVector({
    x: (dx / length) * dir + avoid.x,
    y: (dy / length) * dir + avoid.y
  });
  updateTeamLeader(team, intent, dt);
}

function pickBotTarget(team) {
  const candidates = [
    ...game.pickups,
    ...game.chests.filter((chest) => !chest.opened),
    ...game.monsters,
    ...game.teams.filter((other) => other !== team && other.alive)
  ];
  return candidates.sort((a, b) => dist(team, a) - dist(team, b))[0];
}

function followSquad(team, dt) {
  const leader = team.squad[0];
  if (!leader) return;
  const followers = team.squad.length - 1;
  if (followers <= 0) return;

  const speed = Math.hypot(leader.vx, leader.vy);
  const targetFormationAngle = speed > 8 ? Math.atan2(leader.vy, leader.vx) : (team.formationAngle ?? 0);
  team.formationAngle = lerpAngle(team.formationAngle ?? targetFormationAngle, targetFormationAngle, 1 - Math.exp(-8 * dt));

  const biggestRadius = team.squad.reduce((max, unit) => Math.max(max, unit.radius), 0);
  const spacing = biggestRadius * 2 + 18;
  const circleRadius = Math.max(48, (followers * spacing) / (Math.PI * 2));

  for (let i = 1; i < team.squad.length; i++) {
    const unit = team.squad[i];
    const angle = team.formationAngle - Math.PI / 2 + ((i - 1) / followers) * Math.PI * 2;
    const slot = {
      x: leader.x + Math.cos(angle) * circleRadius,
      y: leader.y + Math.sin(angle) * circleRadius
    };
    const dx = slot.x - unit.x;
    const dy = slot.y - unit.y;
    const length = Math.hypot(dx, dy);
    const avoid = botAvoidanceVector(unit);
    let intent = { x: 0, y: 0 };
    if (length > 3) {
      const pull = clamp(length / circleRadius, 0.12, 1);
      intent = {
        x: (dx / (length || 1)) * pull + avoid.x * 0.55,
        y: (dy / (length || 1)) * pull + avoid.y * 0.55
      };
    } else if (Math.hypot(avoid.x, avoid.y) > 0.01) {
      intent = { x: avoid.x * 0.4, y: avoid.y * 0.4 };
    }
    const catchup = length > circleRadius * 1.6 ? 1.35 : 1.08;
    moveUnitSmooth(unit, intent, dt, 10, 16, catchup);
  }
  separateSquad(team, dt);
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0.0001) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

function moveUnitSmooth(unit, vector, dt, acceleration = 10, braking = 12, speedScale = 1) {
  const inputLength = Math.min(1, Math.hypot(vector.x, vector.y));
  const direction = inputLength > 0.001 ? normalizeVector(vector) : { x: 0, y: 0 };
  const targetVx = direction.x * unit.speed * speedScale * inputLength;
  const targetVy = direction.y * unit.speed * speedScale * inputLength;
  const rate = inputLength > 0.001 ? acceleration : braking;
  const blend = 1 - Math.exp(-rate * dt);

  unit.vx += (targetVx - unit.vx) * blend;
  unit.vy += (targetVy - unit.vy) * blend;
  unit.x += unit.vx * dt;
  unit.y += unit.vy * dt;
  keepInsideWorld(unit);

  const velocity = Math.hypot(unit.vx, unit.vy);
  if (velocity > 6) {
    const targetAngle = Math.atan2(unit.vx, unit.vy);
    unit.faceAngle = lerpAngle(unit.faceAngle, targetAngle, 1 - Math.exp(-12 * dt));
    unit.walkPhase += velocity * dt * 0.055;
  }
}

function keepInsideWorld(unit) {
  const min = unit.radius + 7;
  const maxX = game.world.width - min;
  const maxY = game.world.height - min;
  if (unit.x < min) {
    unit.x = min;
    unit.vx = Math.max(0, unit.vx);
  }
  if (unit.x > maxX) {
    unit.x = maxX;
    unit.vx = Math.min(0, unit.vx);
  }
  if (unit.y < min) {
    unit.y = min;
    unit.vy = Math.max(0, unit.vy);
  }
  if (unit.y > maxY) {
    unit.y = maxY;
    unit.vy = Math.min(0, unit.vy);
  }
}

function lerpAngle(current, target, amount) {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * amount;
}

function separateSquad(team, dt) {
  for (let i = 0; i < team.squad.length; i++) {
    for (let j = i + 1; j < team.squad.length; j++) {
      const a = team.squad[i];
      const b = team.squad[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const minDistance = a.radius + b.radius + 5;
      if (length >= minDistance) continue;
      const push = (minDistance - length) * 0.5 * Math.min(1, dt * 18);
      const nx = dx / length;
      const ny = dy / length;
      if (i !== 0) {
        a.x -= nx * push;
        a.y -= ny * push;
      }
      b.x += nx * push;
      b.y += ny * push;
      keepInsideWorld(a);
      keepInsideWorld(b);
    }
  }
}

function botAvoidanceVector(unit) {
  const avoid = { x: 0, y: 0 };
  const edge = 105;
  if (unit.x < edge) avoid.x += (edge - unit.x) / edge;
  if (unit.x > game.world.width - edge) avoid.x -= (unit.x - (game.world.width - edge)) / edge;
  if (unit.y < edge) avoid.y += (edge - unit.y) / edge;
  if (unit.y > game.world.height - edge) avoid.y -= (unit.y - (game.world.height - edge)) / edge;

  game.obstacles.forEach((obstacle) => {
    const left = obstacle.x - obstacle.w / 2;
    const right = obstacle.x + obstacle.w / 2;
    const top = obstacle.y - obstacle.h / 2;
    const bottom = obstacle.y + obstacle.h / 2;
    const closestX = clamp(unit.x, left, right);
    const closestY = clamp(unit.y, top, bottom);
    const dx = unit.x - closestX;
    const dy = unit.y - closestY;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001 && unit.x > left && unit.x < right && unit.y > top && unit.y < bottom) {
      const exits = [
        { x: -1, y: 0, d: unit.x - left },
        { x: 1, y: 0, d: right - unit.x },
        { x: 0, y: -1, d: unit.y - top },
        { x: 0, y: 1, d: bottom - unit.y }
      ].sort((a, b) => a.d - b.d)[0];
      avoid.x += exits.x * 1.8;
      avoid.y += exits.y * 1.8;
    } else if (distance > 0.001 && distance < 96) {
      const force = (96 - distance) / 96;
      avoid.x += (dx / distance) * force * 1.4;
      avoid.y += (dy / distance) * force * 1.4;
    }
  });

  return avoid;
}

function updateUnitCombat(team, unit, moving, dt) {
  unit.cooldown -= dt;
  unit.healTimer -= dt;
  if (unit.role === "лекарь" && unit.healTimer <= 0) {
    unit.healTimer = 1.3;
    const hurt = team.squad.find((ally) => ally.hp < ally.maxHp);
    if (hurt) {
      hurt.hp = Math.min(hurt.maxHp, hurt.hp + 12 * unit.level);
      addEffect(hurt.x, hurt.y, "+", "#5be37d");
    }
  }
  if (moving || unit.cooldown > 0) return;
  const target = nearestEnemy(team, unit);
  if (!target || dist(unit, target) > unit.range + target.radius) return;
  unit.cooldown = unit.role === "ассасин" ? 0.42 : 0.72;
  target.hp -= unit.damage;
  addEffect(target.x, target.y, Math.round(unit.damage), unit.color);
}

function nearestEnemy(team, unit) {
  const enemies = [
    ...game.monsters,
    ...game.chests.filter((chest) => !chest.opened),
    ...game.teams.filter((other) => other !== team && other.alive).flatMap((other) => other.squad)
  ];
  return enemies.sort((a, b) => dist(unit, a) - dist(unit, b))[0];
}

function updateMonsters(dt) {
  game.monsters.forEach((monster) => {
    monster.cooldown -= dt;
    const allUnits = game.teams.filter((team) => team.alive).flatMap((team) => team.squad.map((unit) => ({ unit, team })));
    const nearest = allUnits.sort((a, b) => dist(monster, a.unit) - dist(monster, b.unit))[0];
    if (!nearest) return;
    const d = dist(monster, nearest.unit);
    if (d < 250 && d > monster.range) {
      monster.x += ((nearest.unit.x - monster.x) / d) * 48 * dt;
      monster.y += ((nearest.unit.y - monster.y) / d) * 48 * dt;
    }
    if (d <= monster.range + nearest.unit.radius && monster.cooldown <= 0) {
      monster.cooldown = 0.95;
      nearest.unit.hp -= monster.damage;
      addEffect(nearest.unit.x, nearest.unit.y, Math.round(monster.damage), "#6f3fb5");
    }
  });
}

function collectPickups() {
  game.teams.forEach((team) => {
    if (!team.alive) return;
    const leader = team.squad[0];
    if (!leader) return;
    game.pickups = game.pickups.filter((pickup) => {
      if (dist(leader, pickup) > 32) return true;
      if (pickup.kind === "gem") team.gems += pickup.value;
      if (pickup.kind === "coin") team.coins += pickup.value;
      if (pickup.kind === "boost") addRandomHero(team);
      addEffect(pickup.x, pickup.y, pickup.kind === "boost" ? "+1" : "+", pickup.kind === "gem" ? "#13c7d4" : "#ffca3a");
      return false;
    });
  });
}

function openChests() {
  game.chests.forEach((chest) => {
    if (chest.opened || chest.hp > 0) return;
    chest.opened = true;
    const opener = closestTeam(chest);
    if (opener) {
      opener.coins += 8;
      opener.gems += 3;
      addRandomHero(opener);
    }
    addEffect(chest.x, chest.y, "сундук", "#ffca3a");
  });
}

function closestTeam(point) {
  return game.teams.filter((team) => team.alive).sort((a, b) => dist(point, a) - dist(point, b))[0];
}

function addRandomHero(team) {
  const hero = heroes[Math.floor(Math.random() * heroes.length)];
  const same = team.squad.filter((unit) => unit.heroId === hero.id);
  if (same.length >= 2) {
    same[0].level += 1;
    same[0].maxHp *= 1.45;
    same[0].hp = same[0].maxHp;
    same[0].damage *= 1.45;
    same[0].radius += 3;
    const removed = same[1];
    team.squad = team.squad.filter((unit) => unit !== removed);
    addEffect(same[0].x, same[0].y, "fusion", hero.color);
    return;
  }
  const leader = team.squad[0] || team;
  team.squad.push(makeUnit(hero.id, leader.x + rand(-32, 32), leader.y + rand(-32, 32), team.isPlayer ? "player" : "bot", 1));
}

function cleanupDead() {
  game.monsters = game.monsters.filter((monster) => {
    if (monster.hp > 0) return true;
    game.pickups.push({ kind: "gem", x: monster.x, y: monster.y, value: monster.gems, radius: 12 });
    game.pickups.push({ kind: "coin", x: monster.x + 16, y: monster.y, value: monster.coins, radius: 10 });
    return false;
  });

  game.teams.forEach((team) => {
    const before = team.squad.length;
    team.squad = team.squad.filter((unit) => unit.hp > 0);
    if (team.squad.length < before) {
      team.gems = Math.floor(team.gems * 0.75);
    }
    if (team.squad.length === 0 && team.alive) {
      team.alive = false;
      for (let i = 0; i < Math.max(4, Math.floor(team.gems / 2)); i++) {
        game.pickups.push({ kind: "gem", x: team.x + rand(-35, 35), y: team.y + rand(-35, 35), value: 1, radius: 11 });
      }
    }
  });
}

function updateHud() {
  const minutes = Math.floor(game.timeLeft / 60);
  const seconds = Math.max(0, Math.floor(game.timeLeft % 60)).toString().padStart(2, "0");
  ui.timer.textContent = `${minutes}:${seconds}`;
  ui.gems.textContent = game.player.gems;
  ui.coins.textContent = game.player.coins;
  ui.squad.innerHTML = game.player.squad.map((unit) => `
    <span class="squad-chip portrait-chip" style="background-image:url('${unit.portrait}')">${unit.level > 1 ? unit.level : ""}</span>
  `).join("");
}

function addEffect(x, y, text, color) {
  game.effects.push({ x, y, text, color, life: 0.85 });
}

function endMatch() {
  game.ended = true;
  const standings = [...game.teams].sort((a, b) => b.gems - a.gems);
  const place = standings.indexOf(game.player) + 1;
  const reward = Math.max(12, game.player.coins + (standings.length - place + 1) * 8);
  save.coins += reward;
  if (currentUser) {
    currentUser.matches = (currentUser.matches || 0) + 1;
    if (place === 1) currentUser.wins = (currentUser.wins || 0) + 1;
  }
  persist();
  const won = place === 1;

  ui.resultTitle.textContent = place === 1 ? "Победа!" : `Место ${place}`;
  ui.rewardLine.textContent = `Награда: ${reward} монет · собрано ${game.player.gems} кристаллов`;
  ui.victoryLogo.hidden = !won;
  ui.placeLogo.hidden = true;
  ui.resultTitle.hidden = false;
  if (won) {
    ui.resultTitle.hidden = true;
    ui.resultTitle.textContent = "";
  } else if (resultPlaceLogos[place]) {
    ui.placeLogo.src = resultPlaceLogos[place];
    ui.placeLogo.alt = `${place} место`;
    ui.placeLogo.hidden = false;
    ui.resultTitle.hidden = true;
  }
  ui.scoreboard.innerHTML = standings.map((team, index) => `
    <div class="score-row">
      <span>${index + 1}</span>
      <span>${team.id}</span>
      <span>${team.gems}</span>
    </div>
  `).join("");
  renderMenu();
  showScreen("results");
}

function draw() {
  if (!game || !renderer) return;
  syncScene3D();
  renderer.render(scene, camera3D);
}

function syncScene3D() {
  const aliveObjects = new Set();
  const leader = game.player.squad[0] || game.player;
  const cameraBlend = 0.08;
  game.camera.x += (leader.x - game.camera.x) * cameraBlend;
  game.camera.y += (leader.y - game.camera.y) * cameraBlend;
  const camX = to3X(game.camera.x);
  const camZ = to3Z(game.camera.y);
  camera3D.position.set(camX, 520, camZ + 560);
  camera3D.lookAt(camX, 20, camZ - 110);

  game.pickups.forEach((pickup) => {
    let mesh = sceneObjects.get(pickup);
    if (!mesh) {
      mesh = makePickupMesh(pickup);
      sceneObjects.set(pickup, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(to3X(pickup.x), pickup.kind === "coin" ? 10 : 18 + Math.sin(performance.now() * 0.006) * 4, to3Z(pickup.y));
    mesh.rotation.y += pickup.kind === "gem" ? 0.045 : 0.025;
    aliveObjects.add(mesh);
  });

  game.chests.filter((chest) => !chest.opened).forEach((chest) => {
    let mesh = sceneObjects.get(chest);
    if (!mesh) {
      mesh = makeChestMesh();
      sceneObjects.set(chest, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(to3X(chest.x), 0, to3Z(chest.y));
    aliveObjects.add(mesh);
  });

  game.monsters.forEach((monster) => {
    let mesh = sceneObjects.get(monster);
    if (!mesh) {
      mesh = makeMonsterMesh(monster);
      sceneObjects.set(monster, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(to3X(monster.x), 0, to3Z(monster.y));
    mesh.rotation.y += 0.012;
    aliveObjects.add(mesh);
  });

  game.teams.forEach((team) => {
    if (!team.alive) return;
    team.squad.forEach((unit) => {
      let mesh = sceneObjects.get(unit);
      if (!mesh) {
        mesh = makeUnitMesh(unit, team.isPlayer);
        sceneObjects.set(unit, mesh);
        dynamicGroup.add(mesh);
      }
      mesh.position.set(to3X(unit.x), 0, to3Z(unit.y));
      mesh.rotation.y = unit.faceAngle;
      if (mesh.userData.body) {
        const speedRatio = clamp(Math.hypot(unit.vx, unit.vy) / unit.speed, 0, 1);
        const walk = Math.sin(unit.walkPhase);
        mesh.userData.body.rotation.z = walk * 0.045 * speedRatio;
        if (mesh.userData.limbs) {
          mesh.userData.limbs.forEach((limb, index) => {
            limb.rotation.x = walk * (index % 2 === 0 ? 0.34 : -0.34) * speedRatio;
          });
        }
      }
      if (mesh.userData.billboards) {
        mesh.userData.billboards.forEach((item) => item.lookAt(camera3D.position));
      }
      if (mesh.userData.hpBar) {
        const ratio = clamp(unit.hp / unit.maxHp, 0, 1);
        mesh.userData.hpBar.scale.x = ratio;
        mesh.userData.hpBar.position.x = -mesh.userData.hpMaxWidth * (1 - ratio) / 2;
        mesh.userData.hpBar.material.color.set(ratio > 0.35 ? 0x5be37d : 0xff5d5d);
      }
      aliveObjects.add(mesh);
    });
  });

  game.effects = game.effects.filter((effect) => {
    let mesh = sceneObjects.get(effect);
    if (!mesh) {
      mesh = makeEffectMesh(effect);
      sceneObjects.set(effect, mesh);
      effectGroup.add(mesh);
    }
    effect.life -= 0.016;
    mesh.position.set(to3X(effect.x), 82 + (0.85 - effect.life) * 55, to3Z(effect.y));
    mesh.lookAt(camera3D.position);
    mesh.material.opacity = clamp(effect.life, 0, 1);
    aliveObjects.add(mesh);
    return effect.life > 0;
  });

  for (const child of [...dynamicGroup.children, ...effectGroup.children]) {
    if (!aliveObjects.has(child)) {
      child.parent.remove(child);
      disposeObject(child);
    }
  }
}

function makeEffectMesh(effect) {
  const label = document.createElement("canvas");
  label.width = 128;
  label.height = 64;
  const labelCtx = label.getContext("2d");
  labelCtx.font = "900 28px system-ui";
  labelCtx.textAlign = "center";
  labelCtx.textBaseline = "middle";
  labelCtx.fillStyle = effect.color;
  labelCtx.strokeStyle = "rgba(23,33,43,0.45)";
  labelCtx.lineWidth = 5;
  labelCtx.strokeText(String(effect.text), 64, 32);
  labelCtx.fillText(String(effect.text), 64, 32);
  const texture = new THREE.CanvasTexture(label);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(64, 32), material);
}

function drawArena() {
  ctx.fillStyle = "#78cf63";
  ctx.fillRect(0, 0, game.world.width, game.world.height);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  for (let x = 0; x < game.world.width; x += 120) {
    for (let y = 0; y < game.world.height; y += 120) {
      ctx.beginPath();
      ctx.arc(x + 32, y + 36, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  game.obstacles.forEach((item) => {
    ctx.fillStyle = item.kind === "bush" ? "#2f9f4f" : "#8b98a4";
    roundRect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(item.x - item.w / 2 + 8, item.y - item.h / 2 + 6, item.w * 0.45, 8, 6);
    ctx.fill();
  });
}

function drawPickup(pickup) {
  ctx.save();
  ctx.translate(pickup.x, pickup.y);
  if (pickup.kind === "gem") {
    ctx.fillStyle = "#13c7d4";
    ctx.rotate(Math.PI / 4);
    roundRect(-8, -8, 16, 16, 4);
    ctx.fill();
  } else if (pickup.kind === "boost") {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff5d5d";
    ctx.fillRect(-3, -8, 6, 16);
    ctx.fillRect(-8, -3, 16, 6);
  } else {
    ctx.fillStyle = "#ffca3a";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawChest(chest) {
  if (chest.opened) return;
  ctx.fillStyle = "#9f642f";
  roundRect(chest.x - 18, chest.y - 15, 36, 30, 6);
  ctx.fill();
  ctx.fillStyle = "#ffca3a";
  ctx.fillRect(chest.x - 18, chest.y - 3, 36, 6);
  ctx.fillRect(chest.x - 3, chest.y - 15, 6, 30);
}

function drawMonster(monster) {
  ctx.fillStyle = monster.color;
  ctx.beginPath();
  ctx.arc(monster.x, monster.y, monster.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(monster.x - monster.radius * 0.35, monster.y - 4, 4, 0, Math.PI * 2);
  ctx.arc(monster.x + monster.radius * 0.35, monster.y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  healthBar(monster);
}

function drawUnit(unit, isPlayer) {
  ctx.fillStyle = "rgba(23, 33, 43, 0.18)";
  ctx.beginPath();
  ctx.ellipse(unit.x, unit.y + unit.radius, unit.radius * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = unit.color;
  ctx.beginPath();
  ctx.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = isPlayer ? 4 : 3;
  ctx.strokeStyle = isPlayer ? "#ffffff" : "#26313a";
  ctx.stroke();
  drawUnitPortrait(unit);
  if (unit.level > 1) {
    ctx.fillStyle = "#ffca3a";
    ctx.beginPath();
    ctx.arc(unit.x + unit.radius - 2, unit.y - unit.radius + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17212b";
    ctx.font = "900 10px system-ui";
    ctx.fillText(unit.level, unit.x + unit.radius - 2, unit.y - unit.radius + 2);
  }
  healthBar(unit);
}

function drawUnitPortrait(unit) {
  const image = portraitImages.get(unit.heroId);
  const size = unit.radius * 1.52;
  if (!image || !image.complete || image.naturalWidth === 0) {
    ctx.fillStyle = "#ffffff";
    drawUnitIcon(unit.icon, unit.x, unit.y, unit.radius * 0.82);
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(unit.x, unit.y, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, unit.x - size / 2, unit.y - size / 2, size, size);
  ctx.restore();
}

function drawUnitIcon(icon, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2.4, size * 0.17);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (icon === "shield") {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.72, -size * 0.62);
    ctx.lineTo(size * 0.48, size * 0.55);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.48, size * 0.55);
    ctx.lineTo(-size * 0.72, -size * 0.62);
    ctx.closePath();
    ctx.stroke();
  }

  if (icon === "target") {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
    ctx.moveTo(size * 0.28, 0);
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
  }

  if (icon === "spark") {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.24, -size * 0.24);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.24, size * 0.24);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.24, size * 0.24);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size * 0.24, -size * 0.24);
    ctx.closePath();
    ctx.fill();
  }

  if (icon === "plus") {
    ctx.fillRect(-size * 0.22, -size * 0.82, size * 0.44, size * 1.64);
    ctx.fillRect(-size * 0.82, -size * 0.22, size * 1.64, size * 0.44);
  }

  if (icon === "blade") {
    ctx.beginPath();
    ctx.moveTo(size * 0.72, -size * 0.92);
    ctx.lineTo(size * 0.42, size * 0.42);
    ctx.lineTo(-size * 0.72, size * 0.92);
    ctx.lineTo(-size * 0.28, -size * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-size * 0.82, size * 0.48, size * 0.7, size * 0.22);
  }

  if (icon === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? size : size * 0.42;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function healthBar(entity) {
  const width = entity.radius * 2;
  const x = entity.x - width / 2;
  const y = entity.y - entity.radius - 12;
  ctx.fillStyle = "rgba(23, 33, 43, 0.24)";
  roundRect(x, y, width, 5, 3);
  ctx.fill();
  ctx.fillStyle = entity.hp / entity.maxHp > 0.35 ? "#5be37d" : "#ff5d5d";
  roundRect(x, y, width * clamp(entity.hp / entity.maxHp, 0, 1), 5, 3);
  ctx.fill();
}

function drawEffects() {
  game.effects = game.effects.filter((effect) => {
    effect.life -= 0.016;
    effect.y -= 0.7;
    ctx.globalAlpha = clamp(effect.life, 0, 1);
    ctx.fillStyle = effect.color;
    ctx.font = "900 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(effect.text, effect.x, effect.y);
    ctx.globalAlpha = 1;
    return effect.life > 0;
  });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setJoystick(clientX, clientY) {
  const rect = ui.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const max = rect.width * 0.32;
  const length = Math.min(Math.hypot(dx, dy), max);
  const angle = Math.atan2(dy, dx);
  const x = Math.cos(angle) * length;
  const y = Math.sin(angle) * length;
  joystick.x = x / max;
  joystick.y = y / max;
  ui.stick.style.transform = `translate(${x}px, ${y}px)`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.pointer = null;
  joystick.x = 0;
  joystick.y = 0;
  ui.stick.style.transform = "translate(0, 0)";
}

ui.play.addEventListener("click", startMatch);
ui.again.addEventListener("click", startMatch);
ui.menu.addEventListener("click", () => showScreen("menu"));
ui.loginTab.addEventListener("click", () => setAuthMode("login"));
ui.registerTab.addEventListener("click", () => setAuthMode("register"));
ui.authForm.addEventListener("submit", submitAuth);
ui.logout.addEventListener("click", logout);
ui.createRoom.addEventListener("click", async () => {
  try {
    const data = await api("/api/rooms", { method: "POST", body: "{}" });
    ui.roomCode.value = data.room;
    await startOnlineMatch(data.room);
  } catch (error) {
    ui.onlineStatus.textContent = error.message;
  }
});
ui.quickMatch.addEventListener("click", async () => {
  try {
    const data = await api("/api/matchmake", { method: "POST", body: "{}" });
    ui.roomCode.value = data.room;
    await startOnlineMatch(data.room);
  } catch (error) {
    ui.onlineStatus.textContent = error.message;
  }
});
ui.joinRoom.addEventListener("click", async () => {
  const room = ui.roomCode.value.trim();
  if (!room) return ui.onlineStatus.textContent = "Введите код комнаты.";
  await startOnlineMatch(room);
});
ui.pause.addEventListener("click", () => {
  if (!game) return;
  game.paused = !game.paused;
  ui.pause.textContent = game.paused ? ">" : "II";
});

ui.joystick.addEventListener("pointerdown", (event) => {
  joystick.active = true;
  joystick.pointer = event.pointerId;
  ui.joystick.setPointerCapture(event.pointerId);
  setJoystick(event.clientX, event.clientY);
});

ui.joystick.addEventListener("pointermove", (event) => {
  if (!joystick.active || joystick.pointer !== event.pointerId) return;
  setJoystick(event.clientX, event.clientY);
});

ui.joystick.addEventListener("pointerup", resetJoystick);
ui.joystick.addEventListener("pointercancel", resetJoystick);

window.addEventListener("keydown", (event) => {
  if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
  if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("resize", resizeCanvas);

renderMenu();
bootAuth();
