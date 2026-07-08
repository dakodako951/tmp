# Changelog

All notable changes to this project are documented here.

## [v1.2.0] - 2026-07-08

### Added

- Account registration, login and current-user restore flow.
- Server-side progress storage with SQLite for coins, upgrades, selected hero, wins and matches.
- Online quick match, room creation and room-code join flow.
- WebSocket room state sync for remote players.
- Auth, online and menu Playwright smoke checks.
- Verification screenshots for auth, online and menu layout checks.

### Changed

- Expanded the local Node.js server from static-only serving to API, SQLite and WebSocket support.
- Updated menu layout with account and online controls.
- Updated README with install, server, verification and online feature details.
- Added `hero-rush.db` to `.gitignore` because it is a local runtime database.

## [v1.1.0] - 2026-07-08

### Added

- Unique 3D visual details for every hero role.
- Per-unit facing direction and walking animation based on movement speed.
- Smooth acceleration, braking and squad follow movement.
- Bot avoidance behavior around arena edges and obstacles.
- Smoothed camera follow for a cleaner in-match feel.

### Changed

- Updated keyboard handling to use physical WASD key codes and prevent page-level movement conflicts.
- Refreshed desktop and mobile 3D verification screenshots.
- Updated README feature list to describe the new movement and hero model improvements.

## [v1.0.0] - 2026-07-08

### Added

- Initial Hero Rush web game.
- Three.js arena with animated player squad, bots, monsters, chests, pickups and effects.
- Six playable hero roles: tank, ranger, mage, healer, assassin and support.
- Shop upgrades for speed, damage and health.
- Responsive menu, HUD, results screen and mobile joystick.
- Local static server for asset loading.
- NPM scripts for local start, syntax checks and 3D smoke testing.
- Playwright-based 3D smoke check for desktop and mobile viewports.
- Desktop and mobile verification screenshots.

### Documentation

- Added project README with run instructions, controls, structure and verification steps.
- Added changelog for the first tagged release.
