# NestGram

A production-grade social platform REST API built with NestJS, featuring JWT authentication with Redis session validation, file uploads to S3-compatible storage, and a full content model (posts, comments, likes).

## Architecture

Architecture is documented as C4 diagrams and sequence flows in [`/docs`](./docs/):

- [`docs/c4.md`](./docs/c4.md) — System Context, Container, Component diagrams + ER schema + security summary
- [`docs/sequence.md`](./docs/sequence.md) — Detailed sequence diagrams for every critical flow (signup, signin, refresh, logout, file upload, post creation)

**Key architectural decisions:**

- **Dual-token auth** — Short-lived JWT (15 min) paired with a Redis session ID cross-check on every request. Token revocation is O(1) via Redis key deletion on logout.
- **Stateless service layer** — All session state lives in Redis, not in-process. Horizontal scaling of the API container requires no sticky sessions.
- **Global `AuthGuard`** — Applied at the app level; routes opt out via `@Public()` decorator rather than opting in, reducing the risk of accidentally unprotected endpoints.
- **File pipeline** — `FileInterceptor (Multer, memory storage)` → `ParseFilePipe` (type + size validation) → `FileService` → `BucketService (S3)` → Prisma metadata persist. Separation ensures S3 and DB concerns are isolated.

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose (for local infrastructure)
- An S3-compatible object storage bucket (AWS S3, MinIO, etc.)

## Setup

### 1. Create the external Docker network

```bash
docker network create nest-bff
```

### 2. Configure environment

Copy and populate the environment file:

```bash
cp .env.example .env.development
```

See [Environment Variables](#environment-variables) for the full list.

### 3. Start infrastructure and run the app

```bash
# Build image and start all services (postgres, redis, migrate, api)
docker compose up --build
```

The migrate service runs `prisma migrate deploy` automatically before the API starts.

### 4. Local development (without Docker for the app)

```bash
# Start only infrastructure
docker compose up postgres redis -d

# Install dependencies
npm install

# Apply migrations
npx prisma migrate deploy

# Start in watch mode
npm run dev
```

API is available at `http://localhost:3001`.

## Environment Variables

| Variable          | Description                                          |
|-------------------|------------------------------------------------------|
| `ALLOWED_ORIGIN`  | CORS allowed origin (e.g. `http://localhost:3000`)   |
| `DOMAIN`          | Cookie domain                                        |
| `POSTGRES_URI`    | Full PostgreSQL connection string                    |
| `REDIS_HOST`      | Redis hostname                                       |
| `REDIS_PORT`      | Redis port (default `6379`)                          |
| `REDIS_USERNAME`  | Redis username                                       |
| `REDIS_PASSWORD`  | Redis password                                       |
| `JWT_SECRET`      | Secret for signing JWT access and refresh tokens     |
| `S3_BUCKET_NAME`  | S3 bucket name                                       |
| `S3_REGION`       | S3 region                                            |
| `S3_HOST`         | S3 endpoint host (for S3-compatible providers)       |
| `S3_KEY`          | S3 access key ID                                     |
| `S3_SECRET`       | S3 secret access key                                 |

## Available Scripts

| Script            | Description                                     |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Start in development watch mode                 |
| `npm run build`   | Compile TypeScript to `dist/`                   |
| `npm run start`   | Start in production mode (requires built dist)  |
| `npm run start:prod` | Run compiled production build               |
| `npm run lint`    | Run ESLint + TypeScript type check              |
| `npm run lint:fix`| Auto-fix ESLint issues                          |
| `npm run format`  | Format code with Prettier                       |
| `npm run test`    | Run unit tests                                  |
| `npm run test:cov`| Run unit tests with coverage report             |
| `npm run test:e2e`| Run end-to-end tests                            |

## API Endpoints

| Method | Path                      | Auth | Description                        |
|--------|---------------------------|------|------------------------------------|
| POST   | `/v1/auth/signup`         | No   | Register a new user                |
| POST   | `/v1/auth/signin`         | No   | Sign in, receive cookies           |
| POST   | `/v1/auth/refresh`        | No   | Refresh access token via cookie    |
| POST   | `/v1/auth/logout`         | Yes  | Invalidate session in Redis        |
| GET    | `/v1/auth/validate`       | Yes  | Validate current session           |
| GET    | `/v1/users/me`            | Yes  | Get current user profile           |
| GET    | `/v1/users/:id/posts`     | Yes  | Get posts by user ID               |
| POST   | `/v1/posts`               | Yes  | Create a post                      |
| POST   | `/v1/file/upload`         | Yes  | Upload a file (multipart/form-data)|

Swagger UI is available at `/api` in non-production environments.

## Deployment

1. Build the Docker image: `docker build -t nest-bff .`
2. Ensure the external `nest-bff` Docker network exists on the target host.
3. Set all environment variables in `.env.production` or inject via your orchestrator (Kubernetes secrets, ECS task definitions, etc.).
4. Run migrations before deploying new replicas: `npx prisma migrate deploy`.
5. The `migrate` compose service handles this automatically in Docker Compose deployments.

**Production checklist:**
- `NODE_ENV=production` must be set (enables secure cookie flags)
- `JWT_SECRET` must be at least 32 characters of random entropy
- Redis must require password authentication (`requirepass` is set in compose)
- S3 bucket policy should be locked down; only grant `public-read` ACL on explicitly public files
