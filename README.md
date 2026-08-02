# AtomList-3.0

Spring Boot 4.1 / Java 21 backend with passwordless (email code) authentication, JWT access tokens and cookie-based refresh tokens.


---

## Running locally

Locally every variable has a working default except the datasource and the JWT secret. The app starts with no mail provider configured and writes login codes to the console instead of sending them,
which is enough to sign in during development.

Minimum local environment:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/atomlist
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET=any-random-string-of-at-least-32-characters
```

---

## Deploying to Railway

### Step 1 - Set the service Root Directory to `backend`

**This is the step that makes the build work.** Railway's builder (Railpack) decides how to build the app by looking for a `pom.xml` in the directory it is pointed at.

### Step 2 - Create the database

**New → Database → PostgreSQL**, inside the same Railway project as the backend service. Keeping them in one project is what allows the variable references in the next step to resolve, and lets
traffic stay on Railway's private network.

### Step 3 - Set the environment variables

**Your service → Variables → Raw Editor**, then paste the block below and edit the placeholder values.

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=${{PORT}}
RAILPACK_JDK_VERSION=25

SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}

JWT_SECRET=<random string, 32+ characters>

RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=no-reply@yourdomain.com
MAIL_VERIFICATION_URL=https://your-frontend.pages.dev/verify-email?token={token}

CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend.pages.dev
TRUSTED_PROXY_COUNT=1
```

`Postgres` in those `${{ }}` references is the **service name** of the database. If the service is named something else in your project, use that name instead.

### Step 4 — Verify

Watch the deploy logs, then:

```bash
curl https://<your-service>.up.railway.app/actuator/health
# {"status":"UP"}
```

---

## Environment variables

### Required — the app will not start without these

There is no default for any of these in `application.yaml`.

| Variable                     | Notes                                                                                                                                                                                                                 |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SPRING_DATASOURCE_URL`      | Must be the JDBC form: `jdbc:postgresql://host:port/database`. Railway's own `DATABASE_URL` is `postgresql://user:pass@host/db`, which the JDBC driver rejects. Build the URL from the parts instead, as shown above. |
| `SPRING_DATASOURCE_USERNAME` | Username to for DB connection                                                                                                                                                                                         |
| `SPRING_DATASOURCE_PASSWORD` | Password for the DB connection                                                                                                                                                                                        |
| `JWT_SECRET`                 | At least 32 characters. HS256 signing key. Generate with `openssl rand -base64 48`. Changing it invalidates every issued access token.                                                                                |

### Required in production — defaults exist but are wrong once deployed

| Variable                       | Production value                          | Why the default fails                                                                                                                                                                                               |
|--------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SPRING_PROFILES_ACTIVE`       | `prod`                                    | Without it `application-prod.yaml` never loads, so Swagger UI stays publicly exposed and SQL statement logging stays on.                                                                                            |
| `RESEND_API_KEY`               | Your key from resend.com                  | Unset selects the log-only mailer, which **refuses to start** under the `prod` profile rather than silently dropping login codes.                                                                                   |
| `MAIL_FROM`                    | An address on a domain verified in Resend | Defaults to `no-reply@localhost`, which Resend rejects.                                                                                                                                                             |
| `MAIL_VERIFICATION_URL`        | Your frontend verification page           | Defaults to `http://localhost:5173/...`. Keep the literal `{token}` placeholder - it is substituted per message. This is a **frontend** URL; the page it opens is what posts the token to `/api/auth/email/verify`. |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Your frontend origin                      | Defaults to `http://localhost:5173`, so the deployed frontend is blocked.                                                                                                                                           |
| `TRUSTED_PROXY_COUNT`          | `1` or `2` — see below                    | Defaults to `0`, so the rate limiter sees Railway's edge IP for every request and buckets all users together: one user hitting the limit locks out everyone.                                                        |

**Choosing `TRUSTED_PROXY_COUNT`** — the number of reverse-proxy hops in front of the app, i.e. how many trailing `X-Forwarded-For` entries were written by infrastructure rather than by the caller.

| Setup                                                                                                | Value |
|------------------------------------------------------------------------------------------------------|-------|
| API served from `*.up.railway.app`, or a custom domain with Cloudflare proxying **off** (grey cloud) | `1`   |
| API custom domain proxied through Cloudflare (orange cloud)                                          | `2`   |

Setting it higher than the real hop count lets callers forge their own source address and bypass the limiter entirely. Setting it lower collapses everyone into a single bucket.

**`CORS_ALLOWED_ORIGIN_PATTERNS` format** — comma-separated. Because the API sends credentials, a wildcard covering a whole public suffix would let any site hosted there read authenticated responses,
so the app refuses to start on one.

| Pattern                                               |                                             |
|-------------------------------------------------------|---------------------------------------------|
| `https://atomlist.pages.dev`                          | valid                                       |
| `https://atomlist-*.pages.dev`                        | valid - scoped wildcard for preview deploys |
| `https://atomlist.pages.dev,https://www.atomlist.com` | valid - multiple origins                    |
| `https://*.pages.dev`                                 | **rejected at startup**                     |
| `*`                                                   | **rejected at startup**                     |

### Platform

| Variable      | Value       | Notes                                                                                                                   |
|---------------|-------------|-------------------------------------------------------------------------------------------------------------------------|
| `SERVER_PORT` | `${{PORT}}` | Railway injects `PORT`; the app reads `SERVER_PORT`. This bridges them. If Railway shows no `PORT`, set both to `8080`. |

### Optional - defaults are production-appropriate

Leave these unset unless you specifically want different behaviour.

| Variable                             | Default                                                                                                                                                                     |
|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `APP_TIME_ZONE`                      | `Europe/Warsaw`                                                                                                                                                             |
| `JWT_ISSUER`                         | `atomlist-app`                                                                                                                                                              |
| `ACCESS_TOKEN_TTL`                   | `10m`                                                                                                                                                                       |
| `REFRESH_TOKEN_TTL`                  | `10d`                                                                                                                                                                       |
| `REFRESH_COOKIE_NAME`                | `__Secure-refreshToken`                                                                                                                                                     |
| `REFRESH_COOKIE_PATH`                | `/api/auth`                                                                                                                                                                 |
| `REFRESH_COOKIE_SECURE`              | `true`                                                                                                                                                                      |
| `REFRESH_COOKIE_SAME_SITE`           | `None` - required while the frontend and API are on different sites. Switch to `Lax` if they ever share one. It is strictly safer and removes the need for the CSRF header. |
| `REFRESH_COOKIE_DOMAIN`              | empty (host-only cookie)                                                                                                                                                    |
| `LOGIN_CODE_LENGTH`                  | `16`                                                                                                                                                                        |
| `LOGIN_CODE_TTL`                     | `15m`                                                                                                                                                                       |
| `LOGIN_CODE_RESEND_COOLDOWN`         | `60s`                                                                                                                                                                       |
| `LOGIN_CODE_MAX_ATTEMPTS`            | `5`                                                                                                                                                                         |
| `LOGIN_LOCKOUT_MAX_ATTEMPTS`         | `10`                                                                                                                                                                        |
| `LOGIN_LOCKOUT_DURATION`             | `60m`                                                                                                                                                                       |
| `EMAIL_VERIFICATION_TTL`             | `1d`                                                                                                                                                                        |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN` | `5m`                                                                                                                                                                        |
| `RATE_LIMIT_ENABLED`                 | `true`                                                                                                                                                                      |
| `RATE_LIMIT_CAPACITY`                | `10`                                                                                                                                                                        |
| `RATE_LIMIT_REFILL_PERIOD`           | `1m`                                                                                                                                                                        |
| `MAIL_FROM_NAME`                     | `AtomList`                                                                                                                                                                  |
| `DB_POOL_SIZE`                       | `5` - managed Postgres plans cap total connections low, and the cap is shared with migrations, `psql` sessions, and the outgoing instance during a rolling deploy.          |
| `DB_POOL_MIN_IDLE`                   | `1`                                                                                                                                                                         |

### FOR NOW - CHANGE LATER

| Variable         | Why                                                                                                                              |
|------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `FLYWAY_ENABLED` | There are no migration files under `src/main/resources/db/`. Flyway stays disabled; Hibernate owns the schema.                   |
| `DDL_AUTO`       | Leave at `update`. Since Flyway is off, this is what creates the tables - `validate` against an empty database fails at startup. |

> `ddl-auto=update` is fine for getting to production, but Hibernate will never drop or alter a
> column safely. Once there is real user data, move the schema to Flyway migrations.

---
