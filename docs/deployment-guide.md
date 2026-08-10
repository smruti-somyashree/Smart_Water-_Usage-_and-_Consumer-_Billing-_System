# SmartWater System Deployment & Operations Guide

Comprehensive guide for local development setup, containerized deployment using Docker Compose, database migration management, and performance load testing.

---

## 🛠️ 1. Technology Stack

* **Backend**: Java 21, Spring Boot 3.4.1, Spring Security (JWT), Spring Data JPA, Flyway DB Migration, Apache PDFBox 3.0.3, JavaMail Sender.
* **Frontend**: React 18, Vite 8, Recharts 2.15, TailwindCSS 3.4, Lucide-react icons.
* **Database**: PostgreSQL 16 Alpine / H2 In-Memory (Dev profile).
* **Containerization**: Docker, Docker Compose.
* **Testing & Benchmarking**: JUnit 5, Mockito, k6 Load Tester.

---

## 🚀 2. Local Development Setup

### Prerequisites
* JDK 21+
* Node.js 20+ & npm 10+
* Maven 3.9+

### A. Run Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
* **Backend API Base**: `http://localhost:8082`
* **Swagger OpenAPI UI**: `http://localhost:8082/swagger-ui/index.html`
* **H2 Database Console**: `http://localhost:8082/h2-console` (JDBC URL: `jdbc:h2:mem:smartwater`)

### B. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
* **Frontend Dev Server**: `http://localhost:5173`

---

## 🐳 3. Production Deployment via Docker Compose

Run the entire application stack (PostgreSQL + Spring Boot Backend + React Frontend) using Docker Compose:

```bash
# Build images and start all services in detached mode
docker-compose up -d --build
```

### Verification Endpoints
* **Frontend Web App**: `http://localhost` (Port 80)
* **Backend REST API**: `http://localhost:8082`
* **PostgreSQL Database**: `localhost:5432` (`smartwater` / `smartwater`)

### Shutdown Services
```bash
docker-compose down -v
```

---

## 🧪 4. Load & Stress Testing (k6)

To execute the automated API load test simulating up to 100 concurrent virtual users:

### Prerequisites
Install k6:
```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6
```

### Run Benchmark Execution
```bash
k6 run docs/load-test.js
```

### Key Target Performance Metrics
* **Target P95 Response Time**: `< 300ms`
* **Target Error Rate**: `< 1.0%`
* **PDF Generation Latency**: `< 250ms`

---

## 🗄️ 5. Database Migrations (Flyway)

Flyway manages schema versioning automatically under `backend/src/main/resources/db/migration/`:

| Version | Migration Script | Description |
| :--- | :--- | :--- |
| `V1` | `V1__init_schema.sql` | Core tables (`apartments`, `households`, `users`, `water_usage_logs`, `tariff_plans`, `billing_cycles`, `invoices`, `alerts`) |
| `V2` | `V2__seed_demo.sql` | Demo seed data for apartments and households |
| `V3` | `V3__add_business_codes.sql` | Business unique codes (`cycleCode`, `apartmentCode`) |
| `V4` | `V4__add_reading_code.sql` | Unique meter reading tracking numbers |
| `V5` | `V5__add_invoice_code.sql` | Formatted invoice tracking numbers |
| `V6` | `V6__add_user_name.sql` | Resident full name schema additions |
| `V7` | `V7__add_user_status.sql` | User approval lifecycle statuses |
| `V8` | `V8__add_payment_and_resident_messages.sql` | Online payment verification & resident message board |

---

## 🔐 6. Environment Variables Reference

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:h2:mem:smartwater` | Database JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `sa` | Database Username |
| `SPRING_DATASOURCE_PASSWORD` | `password` | Database Password |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` | SMTP Mail Server Host |
| `SPRING_MAIL_PORT` | `587` | SMTP Server Port |
| `VITE_API_BASE_URL` | `http://localhost:8082` | React API Base URL |
