# Milestone 1 API reference

The running application exposes Swagger UI at `GET /swagger-ui.html` and machine-readable OpenAPI at `GET /v3/api-docs`.

All endpoints other than registration and login require `Authorization: Bearer <accessToken>`. Errors use `{ "code", "message", "fields" }`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Register an administrator or a resident (residents require a household). |
| POST | `/api/auth/login` | public | Receive access and refresh JWTs. |
| GET / PUT | `/api/users/me` | admin, resident | Retrieve or update the signed-in user email. |
| POST | `/api/apartments` | admin | Create an apartment. |
| GET | `/api/apartments/{id}` | admin, resident | Retrieve an apartment. |
| POST | `/api/apartments/{id}/households` | admin | Add a household. |
| GET / PUT | `/api/households/{id}` | admin, resident / admin | Retrieve or update a household. |
| PUT | `/api/households/{id}/meter` | admin | Enable or disable a meter. |
| POST | `/api/households/{id}/usage` | admin, resident | Add a manual cumulative meter reading. |
| POST | `/api/apartments/{id}/usage/bulk-csv` | admin | Upload CSV with `flat_number,reading_date,meter_reading_kl`. |

Export the live OpenAPI definition after startup with:

```powershell
Invoke-WebRequest http://localhost:8080/v3/api-docs -OutFile docs/openapi-milestone1.json
```
