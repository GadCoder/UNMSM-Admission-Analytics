# frontend-app-bootstrap-foundation Specification

## Purpose
TBD - created by archiving change bootstrap-frontend-foundation. Update Purpose after archive.
## Requirements
### Requirement: Frontend Runtime Foundation
The system SHALL provide a frontend application scaffold using React, TypeScript, and a modern build tool that boots successfully in local development.

#### Scenario: Development server boots
- **WHEN** a developer installs dependencies and starts the frontend development server
- **THEN** the application starts successfully without requiring feature-specific page implementations

### Requirement: Design-System-Ready Theme Configuration
The system SHALL configure Tailwind CSS and expose design-system-aligned theme tokens for primary colors, semantic colors, typography, radius, and soft shadow values defined in `openspec/design-system.md`.

#### Scenario: Theme tokens are available
- **WHEN** developers use Tailwind theme extensions in UI code
- **THEN** they can reference the configured design-system tokens without duplicating raw constants in components

### Requirement: Global Lexend Typography
The system SHALL configure Lexend as the global frontend font so that all rendered routes inherit the design-system typography baseline by default.

#### Scenario: Root route renders with global typography
- **WHEN** the placeholder route is rendered
- **THEN** the route content uses the globally configured Lexend font stack

### Requirement: Root Providers and Routing
The system SHALL configure routing and TanStack Query at the application root through centralized provider composition and support shell-wrapped multi-page route composition.

#### Scenario: Placeholder route resolves
- **WHEN** a user navigates to the base application route
- **THEN** the router resolves a placeholder page successfully under the root provider tree

#### Scenario: Shell-managed route tree is supported
- **WHEN** the frontend registers shell-managed routes
- **THEN** the root routing composition supports rendering shared layout wrappers with nested child page routes

### Requirement: Centralized API Client Boundary
The system SHALL provide a centralized API client module built on a dedicated HTTP client library, using environment-based backend base URL configuration for outbound REST communication.

#### Scenario: API base URL is environment-driven
- **WHEN** the frontend runtime initializes API client configuration
- **THEN** the backend base URL is read from environment configuration instead of being hardcoded in feature code

#### Scenario: Dedicated client is the transport foundation
- **WHEN** feature modules execute backend requests
- **THEN** requests are executed through the dedicated HTTP client integration exposed by `src/lib/api` rather than direct `fetch` usage in feature code

### Requirement: Scalable Frontend Project Structure
The system SHALL include an initial source folder structure that separates app bootstrap concerns, shared libraries, routing, and future feature modules.

#### Scenario: Source tree supports feature expansion
- **WHEN** a developer adds a new frontend feature
- **THEN** the feature can be added within the established structure without refactoring bootstrap-level modules

