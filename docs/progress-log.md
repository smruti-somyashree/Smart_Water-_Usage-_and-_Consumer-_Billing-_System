# Progress log

## 2026-07-30 — 3.1 Database schema

Verified Flyway migrations `V1__init_schema.sql` and `V2__seed_demo.sql`. They create only apartments, households, users, and water usage logs, then seed Demo Heights, two households, and admin/resident users. Matching JPA entities and repositories are in `backend/src/main/java/com/smartwater/billing/SmartWaterApplication.java`.

## 2026-07-30 — 3.2 Security

Verified stateless Spring Security 6 configuration, BCrypt password storage, signed JWT access and refresh tokens, auth register/login, and protected self-service user profile endpoints.

## 2026-07-30 — 3.3 Core REST APIs

Verified apartment onboarding, household create/read/update, meter configuration, manual readings, and transactional multipart CSV ingestion. Validation errors and domain errors are returned as structured responses. Removed billing and alert implementation from the backend to keep this repository at Milestone 1.

## 2026-07-30 — 3.4 Tests and documentation

Added Mockito coverage for both service classes, including happy paths, duplicate, not-found, invalid configuration, and authentication errors. Existing MockMvc integration tests cover login, profile lookup, apartment onboarding, household/meter/usage workflow, and CSV upload. Historical Surefire reports show the prior suite passed; a new run is blocked here because Maven cannot create file-lock channels for the sandboxed local repository. Docker and `psql` are also unavailable, so PostgreSQL/Compose startup could not be executed in this environment.
