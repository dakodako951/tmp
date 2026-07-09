# Changelog

All notable changes to this project are documented here.

## [v1.4.0] - 2026-07-09

### Added

- Transparent raster Hero Rush logo for the main menu.
- Illustrated menu background image.
- Victory logo on the results screen.
- Place-specific result images for second through eighth place.
- Result and menu scroll verification screenshots.

### Changed

- Updated result screen rendering to show visual victory and placement assets.
- Refined menu scrolling and background layout for the new art direction.
- Refreshed desktop, mobile and menu verification screenshots.

## [v1.3.0] - 2026-07-08

### Added

- Branded SVG logo asset for the main menu.
- SVG static asset serving in the local Node.js server.
- Circle-style squad follow formation around the leader.

### Changed

- Reworked the main menu hero area to use the new logo instead of text headline copy.
- Updated menu layout smoke check to validate logo placement and size.
- Refreshed desktop, mobile and menu verification screenshots.

## [v1.2.1] - 2026-07-08

### Changed

- Adjusted the menu grid so the online account panel sits below the hero roster area.
- Stabilized the shop panel height, spacing and title alignment.
- Refreshed the menu layout verification screenshot.

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
