# admin-authentication-and-authorization Specification

## Purpose
Define admin authentication and authorization behavior for backend endpoints and frontend admin routes.

## Requirements
### Requirement: Admin login authentication
The system SHALL provide an admin login endpoint that returns a bearer token for authenticated admin sessions.

#### Scenario: Valid admin credentials return token
- **WHEN** a client submits valid admin credentials
- **THEN** the API returns `200 OK` with a JWT access token and token metadata

#### Scenario: Invalid credentials are rejected
- **WHEN** a client submits invalid admin credentials
- **THEN** the API returns an authentication error response and no token

### Requirement: Admin-only authorization guard
The system MUST enforce an admin authorization guard on admin frontend routes and admin backend endpoints.

#### Scenario: Missing token is rejected on protected endpoint
- **WHEN** a request is made to an admin-protected backend endpoint without a valid bearer token
- **THEN** the API returns `401 Unauthorized`

#### Scenario: Non-admin token is rejected on protected endpoint
- **WHEN** a request is made with a token that is authenticated but lacks admin privileges
- **THEN** the API returns `403 Forbidden`

#### Scenario: Admin token allows protected operation
- **WHEN** a request to an admin-protected endpoint includes a valid admin token
- **THEN** the operation proceeds normally

### Requirement: Frontend admin route protection
The system SHALL protect `/admin/*` frontend routes and require authenticated admin context before rendering management views.

#### Scenario: Unauthenticated user is redirected from admin routes
- **WHEN** an unauthenticated user navigates to `/admin/*`
- **THEN** the frontend redirects to admin login flow

#### Scenario: Authenticated admin can access admin routes
- **WHEN** an authenticated admin user navigates to `/admin/*`
- **THEN** admin pages render and can call protected admin APIs
