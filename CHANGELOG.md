# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-10-29

### Added
- Application version is shown at the bottom of the sidebar. Docker images get it from the git tag via the `APP_VERSION` build arg; local builds use `git describe --tags`

## [2.2.0] - 2026-10-29

### Changed
- User table: removed the redundant "Public Keys" column ([#31](https://github.com/imi-frankfurt/server-management-gui/issues/31))
- User table: sort by username or last update (default: last update, newest first) ([#31](https://github.com/imi-frankfurt/server-management-gui/issues/31))
- User table: filter users by username as you type ([#31](https://github.com/imi-frankfurt/server-management-gui/issues/31))
- User table: "Show enabled" / "Show disabled" toggles; disabled users are hidden by default and shown with a grey row and a "Disabled" badge ([#31](https://github.com/imi-frankfurt/server-management-gui/issues/31))
- Sidebar: the Keycloak account URL is now taken from runtime config (`NUXT_PUBLIC_KEYCLOAK_BASE_URL`, added to `docker-compose.yml`) instead of requesting a login URL
- Icons are bundled locally instead of being loaded from the Iconify CDN
- The authenticated session is cached (`ensureSession`) so middleware, dashboard and refresh plugin share a single request

### Fixed
- Ansible logs have their own loading/error state on the dashboard

### Security
- API proxy rejects path segments that escape `/api/` (e.g. `%2e%2e`)
- API proxy no longer derives the CSRF header from the cookie; `useApi` sends `X-CSRF-Token` on unsafe methods
- API proxy returns `415` for non-JSON bodies and forwards JSON bodies unchanged

## [2.1.0] - 2026-10-28

### Added
- Light mode and a light/dark switch in the sidebar and on the login page; dark remains the default ([#29](https://github.com/imi-frankfurt/server-management-gui/issues/29))
- Regular logo for light mode ([#29](https://github.com/imi-frankfurt/server-management-gui/issues/29))
- Docker images are also built for pull requests and tagged `pr-<number>` ([#29](https://github.com/imi-frankfurt/server-management-gui/issues/29))

### Changed
- Ignored users are now managed via the "Users" action on the dashboard; the separate ignore list has been removed ([#27](https://github.com/imi-frankfurt/server-management-gui/issues/27))
- Component styles use theme tokens from `main.css` instead of hardcoded dark colors ([#29](https://github.com/imi-frankfurt/server-management-gui/issues/29))

## [2.1.0-rc1] - 2026-10-27

### Changed
- Ignored users are now managed via the "Users" action on the dashboard; the separate ignore list has been removed ([#27](https://github.com/imi-frankfurt/server-management-gui/issues/27))

## [2.0.1] - 2026-07-06

No changes; re-tag of 2.0.0.

## [2.0.0] - 2026-07-06

### Added
- Filter and sort for the server list
- Filter in the user assignment ([#1](https://github.com/imi-frankfurt/server-management-gui/issues/1))
- Dedicated page for Ansible logs ([#19](https://github.com/imi-frankfurt/server-management-gui/issues/19))
- Toast notifications for success, info, warning and error messages, replacing browser alerts ([#23](https://github.com/imi-frankfurt/server-management-gui/issues/23))
- Link to the Keycloak account page in the sidebar, with a dynamic URL and fallback ([#14](https://github.com/imi-frankfurt/server-management-gui/issues/14))
- Search for server selection in the ignore list modals ([#12](https://github.com/imi-frankfurt/server-management-gui/issues/12))

### Changed
- Public key is shown instead of the Keycloak ID in the user assignment ([#3](https://github.com/imi-frankfurt/server-management-gui/issues/3))
- The apply button in the user assignment is fixed at the top and always visible ([#3](https://github.com/imi-frankfurt/server-management-gui/issues/3))
- New logo and favicon ([#9](https://github.com/imi-frankfurt/server-management-gui/issues/9))
- Logs and Ansible logs are restricted to admins
- Shared formatting helpers extracted into `useFormatter`

### Fixed
- Logout is triggered on `401` responses and token refresh is more robust ([#5](https://github.com/imi-frankfurt/server-management-gui/issues/5))
- "Edit users" button is hidden for non-admin users ([#16](https://github.com/imi-frankfurt/server-management-gui/issues/16))
- Radio button visibility

## [1.0.3] - 2026-05-27

### Changed
- **Breaking:** "Blacklist" renamed to "Ignore list" throughout the application. API calls moved from `/api/blacklist` to `/api/ignorelist`; UI elements (navigation, logs) updated accordingly ([#7](https://github.com/imi-frankfurt/server-management-gui/issues/7))
- Docker images are pushed to the IMI Harbor registry

### Added
- GNU Affero General Public License v3

## [1.0.2] - 2026-05-18

### Added
- Manual trigger (`workflow_dispatch`) for the Docker image workflow

### Changed
- Repository renamed

## [1.0.1] - 2026-05-18

First tagged release.

### Added
- Dashboard for managing servers with add/edit modals and IP validation
- Server user management: view assigned users, assign users with search, primary user selection
- Blacklist: table grouped by username, view/add/assign modals, server removal
- Activity logs with filtering and retry
- "Last updated" timestamps and assignment counts in tables and modals
- Keycloak authentication with role extraction and token refresh
- CSRF protection for API requests (`useCsrf`)
- Docker and Nginx configuration, `docker-compose.yml`
- GitHub Actions workflow for building and pushing Docker images

### Changed
- "Add to blacklist" button is visible to admins only

[2.2.1]: https://github.com/imi-frankfurt/server-management-gui/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/imi-frankfurt/server-management-gui/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/imi-frankfurt/server-management-gui/compare/v2.1.0-rc1...v2.1.0
[2.1.0-rc1]: https://github.com/imi-frankfurt/server-management-gui/compare/v2.0.1...v2.1.0-rc1
[2.0.1]: https://github.com/imi-frankfurt/server-management-gui/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/imi-frankfurt/server-management-gui/compare/v1.0.3...v2.0.0
[1.0.3]: https://github.com/imi-frankfurt/server-management-gui/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/imi-frankfurt/server-management-gui/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/imi-frankfurt/server-management-gui/releases/tag/v1.0.1
