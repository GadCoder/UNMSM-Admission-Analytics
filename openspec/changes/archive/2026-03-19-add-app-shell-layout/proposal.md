## Why

The frontend now has a technical foundation but still lacks a shared, route-aware application shell to provide consistent navigation and page framing. Implementing the shell now creates a stable layout contract before building dashboard and feature-specific pages.

## What Changes

- Add a reusable global app shell composed of sidebar, top bar, and main content container.
- Add route-aware sidebar navigation with active-item visual state and keyboard-accessible navigation links.
- Integrate shell routing for initial placeholder pages: `/dashboard`, `/explore`, `/compare`, `/rankings`, `/results`, `/trends`.
- Apply design-system-aligned styling for shell surfaces, spacing, hierarchy, and typography.
- Add responsive layout foundation suitable for desktop-first use with later mobile refinements.
- Explicitly exclude user/profile UI and page-specific feature widgets from this change.

## Capabilities

### New Capabilities
- `frontend-app-shell-layout`: Global reusable application shell with sidebar/topbar/content-slot routing integration and design-system-aligned visual behavior.

### Modified Capabilities
- `frontend-app-bootstrap-foundation`: Extend frontend baseline requirements with shell-level route composition and multi-page placeholder integration.

## Impact

- Frontend layout architecture: new shell components (`AppLayout`, `Sidebar`, `Topbar`) and navigation configuration.
- Frontend routing: route tree expansion and shell-wrapped placeholder views.
- Styling: design-system-consistent layout surface, spacing, and active navigation patterns.
- No backend API contract changes and no authentication/user-domain dependencies introduced.
