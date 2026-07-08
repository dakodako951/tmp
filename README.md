# Hero Rush

Hero Rush is a browser-based 3D arena game about collecting a squad, opening chests, defeating bots and finishing the match with the highest crystal score.

## Features

- 3D arena rendered with Three.js.
- Six hero classes with portraits, roles, unique 3D looks and different combat stats.
- Squad growth through pickups and chest rewards.
- Smooth squad movement, camera follow, bot avoidance, monsters, boss enemy, coins, crystals and upgrades.
- Touch joystick for mobile and keyboard controls for desktop.
- Local save for coins and purchased upgrades through `localStorage`.

## Install

```bash
npm install
```

## Run Locally

The project is a static web game. It needs a local server because character portraits are loaded as assets.

```bash
npm start
```

Open:

```text
http://127.0.0.1:5173/
```

## Controls

- Desktop: `WASD` or arrow keys.
- Mobile: on-screen joystick.
- Pause: bottom-right pause button.

## Project Structure

```text
index.html                 Main HTML screen layout
styles.css                 Responsive UI and HUD styles
game.js                    Game loop, 3D scene, combat and progression logic
dev-server.js              Small local static server
check-3d.js                Playwright smoke check for desktop and mobile
3d-check-desktop.png       Desktop verification screenshot
3d-check-mobile.png        Mobile verification screenshot
иконки персонажей/         Hero portrait assets
```

## Verification

Start the local server, then run:

```bash
npm run check
npm run test:3d
```

The script opens the game in desktop and mobile viewports, starts a match, checks that the canvas is active, and writes fresh screenshots.

## Release

See [CHANGELOG.md](CHANGELOG.md) for tagged release notes.
