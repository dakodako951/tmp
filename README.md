# Hero Rush

Hero Rush is a browser-based 3D arena game about collecting a squad, opening chests, defeating bots and finishing the match with the highest crystal score.

## Features

- 3D arena rendered with Three.js.
- Branded visual menu with transparent logo artwork and illustrated background.
- Visual results screen with victory and placement images.
- Six hero classes with portraits, roles, unique 3D looks and different combat stats.
- Account registration and login with server-side progress storage.
- Online quick match, room creation and room-code join flow through WebSocket rooms.
- Squad growth through pickups and chest rewards.
- Smooth squad movement, circular follow formation, camera follow, bot avoidance, monsters, boss enemy, coins, crystals and upgrades.
- Touch joystick for mobile and keyboard controls for desktop.
- Local fallback save through `localStorage` when the server is unavailable.

## Install

```bash
npm install
```

## Run Locally

The game is served by a small Node.js server because it uses static assets, API routes, SQLite progress storage and WebSocket rooms.

```bash
npm start
```

Open:

```text
http://127.0.0.1:5173/
```

The local server creates `hero-rush.db` automatically. This file stores local users and progress and is ignored by Git.

## Controls

- Desktop: `WASD` or arrow keys.
- Mobile: on-screen joystick.
- Pause: bottom-right pause button.

## Project Structure

```text
index.html              Main HTML screen layout
styles.css              Responsive auth, menu, HUD and game UI styles
game.js                 Game loop, 3D scene, auth, online state and progression logic
dev-server.js           Static server, API routes, SQLite storage and WebSocket rooms
assets/                 UI logos and result placement images
значки/                 Source/background visual assets
иконки персонажей/      Hero portrait assets
check-3d.js             Playwright smoke check for desktop and mobile 3D gameplay
check-auth.js           Playwright auth-to-game smoke check
check-online.js         Playwright online quick-match smoke check
check-menu.js           Playwright menu layout smoke check
3d-check-desktop.png    Desktop verification screenshot
3d-check-mobile.png     Mobile verification screenshot
auth-game-check.png     Auth flow verification screenshot
online-check.png        Online flow verification screenshot
menu-layout-check.png   Menu layout verification screenshot
menu-scroll-check.png   Menu scroll verification screenshot
result-place-check.png  Result placement verification screenshot
```

## Verification

Start the local server, then run:

```bash
npm run check
npm run test:3d
npm run test:auth
npm run test:online
npm run test:menu
```

The Playwright checks open the game, cover registration, menu layout, online quick match and 3D gameplay, then write fresh screenshots.

## Release

See [CHANGELOG.md](CHANGELOG.md) for tagged release notes.
