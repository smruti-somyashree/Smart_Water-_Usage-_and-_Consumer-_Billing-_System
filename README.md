# Smart Water Usage and Consumer Billing System

This repository currently delivers **Milestone 1 only**: a Spring Boot REST API for apartment and household setup, cumulative water-meter readings, JWT authentication, and CSV usage imports. Billing, alerts, invoices, and the web UI are deliberately out of scope.

## Prerequisites

- Java 21
- Maven 3.9 or newer
- Docker Desktop with Docker Compose (for PostgreSQL 16)

## Run locally

From the repository root, start PostgreSQL:

```powershell
docker compose up -d
```

Then run the API:

```powershell
cd backend
mvn spring-boot:run
```

The API runs on `http://localhost:8080`. Swagger UI is at `/swagger-ui.html` and the OpenAPI document is at `/v3/api-docs`.

Run tests with `cd backend; mvn test`.

Demo users are `admin@demo.local` and `resident@demo.local`, both with password `password`. The seed apartment is **Demo Heights** with households A-101 and A-102.

## Implemented

- Flyway schema and demo seed for apartments, households, users, and usage logs
- JWT access/refresh-token login and self-service user profile endpoints
- Apartment onboarding, household management, meter configuration, and manual usage readings
- Transactional CSV usage import with duplicate detection
- Validation, structured API errors, unit tests, and MockMvc integration tests

## Next

Tariffs, billing cycles, purchases, invoices, alerts, and the frontend belong to later milestones.
