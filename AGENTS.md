# NestGram / BFF

NestJS 10 BFF (Backend-for-Frontend) for NestGram. Package name is `bff`.

## Quick start

```bash
npm ci                    # install (npm ci, not npm install)
npx prisma generate       # generate Prisma client before build
npm run build             # compile
```

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server with `--watch` (NODE_ENV=development) |
| `npm run start` | Production start (NODE_ENV=production) |
| `npm run build` | `rimraf dist` then `nest build` |
| `npm run lint` | ESLint + `tsc` (type-check). **Run before push.** |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier on `src/` and `test/` |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | E2E tests via `test/jest-e2e.json` |
| `npm run start:prod` | Run compiled `dist/main` directly |

**Pre-commit hook** (husky): runs `npm run lint`. If it fails, commit is blocked.

## Architecture

NestJS 10 with Express platform. 7 feature modules + 2 global infrastructure modules.

### Modules

| Module | Path | Description |
|--------|------|-------------|
| `AppModule` | `src/app/` | Root module, wires everything. Logger middleware on all routes. |
| `AuthModule` | `src/auth/` | JWT auth (access+refresh tokens in httpOnly cookies), global `AuthGuard`. |
| `UserModule` | `src/user/` | User CRUD, imports `PostModule` for user-posts query. |
| `PostModule` | `src/post/` | Post CRUD. |
| `FileModule` | `src/file/` | File upload to S3 + DB record. |
| `BucketModule` | `src/bucket/` | S3-compatible storage abstraction (AWS SDK v3). |
| `RedisModule` | `src/redis/` | Redis client (`ioredis`), JSON get/set with TTL. |
| `PrismaModule` | `src/prisma/` | Prisma 6 client (PostgreSQL). |

**Global modules** (`@Global()`): `PrismaModule`, `RedisModule` — available everywhere without import.

### Auth flow

1. `AuthGuard` (global) checks every route unless decorated with `@isPublic()`.
2. Guard reads `access_token` from httpOnly cookie, verifies JWT, checks session in Redis.
3. `@User('sub')` param decorator extracts fields from verified JWT payload.
4. Refresh token rotates session IDs via Redis.
5. Tokens: access_token (15min), refresh_token (7d).

### Path aliases

`@src/*` → `./src/*` (configured in tsconfig.json paths). Use consistently.
Some files use relative `src/...` — prefer `@src/...` for new code.

### API versioning

URI-based versioning via `@Controller({ path: 'resource', version: '1' })`.

## Config & env

**Validation**: Joi schema in `AppModule` — 9 required vars. App won't start without them.

| Env var | Source |
|---------|--------|
| `ALLOWED_ORIGIN`, `DOMAIN` | CORS + cookie domain |
| `POSTGRES_URI` | Prisma datasource |
| `S3_BUCKET_NAME`, `S3_REGION`, `S3_HOST`, `S3_KEY`, `S3_SECRET` | S3-compatible storage |
| `REDIS_PASSWORD`, `REDIS_USERNAME`, `REDIS_HOST`, `REDIS_PORT` | Redis |
| `JWT_SECRET` | JWT signing |
| `PORT` | Optional, defaults to 3000 |

Env file loading order: `.env` → `.env.${NODE_ENV}`. Docker Compose uses `.env.development`.

## Prisma

- **Schema**: `prisma/schema.prisma`
- **Generated client**: `prisma/generated/` (custom output, not default `node_modules/.prisma`)
- **Import**: `from 'prisma/generated/client'` or `from 'prisma/generated/enums'`
- **Models**: `User`, `Post`, `Comment`, `Like`, `File` — all mapped to plural table names
- **Roles enum**: `USER`, `EDITOR`, `ADMIN` (import from `prisma/generated/enums`)

Always run `npx prisma generate` after schema changes and before build.

## TypeScript quirks

- `strictNullChecks: false`, `noImplicitAny: false` — not strict mode
- `module: commonjs`, `target: esnext`
- `emitDecoratorMetadata: true` + `experimentalDecorators: true` (NestJS requirement)
- `declaration: false` — no `.d.ts` output

## Notable inconsistencies (know before editing)

1. **Import style**: `@src/prisma` (alias) vs `src/prisma` (relative). PostService uses relative.
2. **Typo in shared consts**: `THIFTEEN_MINUTES_IN_MILLISECONDS` (should be FIFTEEN). Keep existing name if editing consts.
3. **Typo in filename**: `create-post-requiest.dto.ts` (should be request). Don't rename without explicit request.
4. **Empty entity**: `src/user/entities/user.entity.ts` — just `export class User {}` (unused).
5. **Prisma schema typo**: `moduleForman` instead of `moduleForman` — it's in the schema, don't "fix" it.
6. **Node.js built-in crypto**: `crypto.randomUUID()` used in auth service — not the `uuid` package.

## Docker

Multi-stage build. `npm ci` → `npx prisma generate` → `npm run build`.

`docker-compose.yml` runs: app + postgres:15 + redis:7 + migrate service.

The `migrate` service runs `npx prisma migrate deploy` on startup. It depends on postgres.

Network `nest-bff` must be created externally before running compose.

## Testing

- **Unit tests**: Jest, `src/` with `*.spec.ts` pattern. Currently no unit tests exist.
- **E2E tests**: `test/` with `*.e2e-spec.ts` pattern, config in `test/jest-e2e.json`.
- E2E stub exists at `test/app.e2e-spec.ts` — just imports `AppModule`, no assertions.

## Linting

ESLint with `@typescript-eslint` (recommended + type-checking) + prettier plugin.
Custom rules: `no-explicit-any` is warn (not error). No interface prefix requirement.

Run `npm run lint` before any push — it runs `eslint` then `tsc` for type checking.

## Git

Branches follow `feat/TASK-N` pattern. PRs merge to `master`.