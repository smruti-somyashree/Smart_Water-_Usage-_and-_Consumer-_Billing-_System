# Decisions

- Runtime: Java 21.0.5 and Spring Boot 3.4.1. Maven 3.10.0-rc-1 was detected. PostgreSQL CLI and Docker were unavailable in this environment; Compose specifies PostgreSQL 16 for local development.
- JWT access tokens expire in 30 minutes; refresh tokens expire in seven days. Rotation and revocation are deferred to a security-hardening milestone.
- Passwords are BCrypt hashes. Emails are normalized to lowercase in the service and are unique in the database.
- Apartment names are at most 120 characters, addresses 300, and flat numbers 30. Flat numbers are unique within an apartment.
- A household must have positive size and occupancy. Meter readings are non-negative, cumulative kL values with three decimal places, no later than today.
- A household can have one reading on a given date. Bulk CSV imports use the exact header `flat_number,reading_date,meter_reading_kl`; a malformed row rejects the complete transaction.
- Test profile uses H2 in PostgreSQL compatibility mode, while production configuration uses PostgreSQL with Flyway validation.
