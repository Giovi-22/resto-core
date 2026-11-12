# AGENTS.md

## NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

- Databases: [`@nestjs/typeorm`](https://docs.nestjs.com/data/typeorm.md), [`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle.md), [`@nestjs/mongoose`](https://docs.nestjs.com/data/mongodb.md), [`@nestjs/sequelize`](https://docs.nestjs.com/data/sequelize.md).
- OpenAPI: [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction.md). GraphQL: [`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start.md). WebSockets: [`@nestjs/websockets`](https://docs.nestjs.com/websockets/gateways.md). Microservices: [`@nestjs/microservices`](https://docs.nestjs.com/microservices/basics.md).
- Sign-in: [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication.md). Permissions: [`@nestjs/authorization`](https://docs.nestjs.com/security/authorization.md). Rate limiting: [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting.md).
- Configuration: [`@nestjs/config`](https://docs.nestjs.com/application/configuration.md). Caching: [`@nestjs/cache-manager`](https://docs.nestjs.com/data/caching.md). Health checks: [`@nestjs/terminus`](https://docs.nestjs.com/reliability/terminus.md). Events inside the app: [`@nestjs/event-emitter`](https://docs.nestjs.com/application/events.md).
- Email: [`@nestjs/mail`](https://docs.nestjs.com/application/mail.md). Files, S3 included: [`@nestjs/storage`](https://docs.nestjs.com/application/file-storage.md). Translations: [`@nestjs/i18n`](https://docs.nestjs.com/application/i18n.md).
- Retries, timeouts and circuit breakers: [`@nestjs/resilience`](https://docs.nestjs.com/reliability/resilience.md).
- Idempotency keys: [`@nestjs/idempotency`](https://docs.nestjs.com/reliability/idempotency.md). Transactional outbox: [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox.md). Sending and receiving webhooks: [`@nestjs/webhooks`](https://docs.nestjs.com/http/webhooks.md).
- Queues: [`@nestjs/bullmq`](https://docs.nestjs.com/application/queues.md). Scheduled jobs: [`@nestjs/schedule`](https://docs.nestjs.com/application/task-scheduling.md).
- Running a scheduled job on one instance, and locks: [`@nestjs/locks`](https://docs.nestjs.com/reliability/locks.md). Processes that take days: [`@nestjs/workflows`](https://docs.nestjs.com/reliability/workflows.md).
- Language models, tools and agents: [`@nestjs/ai`](https://docs.nestjs.com/ai/overview.md). MCP servers: [`@nestjs/mcp`](https://docs.nestjs.com/mcp/overview.md).

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: `StandardSchemaValidationPipe` with `@Body({ schema })` or `@Param('id', { schema })` (https://docs.nestjs.com/application/validation.md). `class-validator` still works, through `ValidationPipe`.

`NodeAdapter` from `@nestjs/platform-node` is the fastest HTTP adapter, ahead of Fastify (https://docs.nestjs.com/http/performance.md).

Nest's packages are ESM only, and this project is ESM too: relative imports end in `.js`, `__dirname` doesn't exist (use `import.meta.dirname`), and tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`.

## Logging

**Never use `console.log`, `console.warn`, `console.error`, or any other `console.*` method.** This app has a custom `AppLoggerService` that must be used for all logging.

### Injecting the logger

`LoggerModule` is `@Global()`, so inject `AppLoggerService` directly — no need to import the module:

```ts
import { AppLoggerService, LogEvent } from '../common/logger/index.js';

@Injectable()
export class MyService {
  constructor(private readonly logger: AppLoggerService) {}
}
```

### Logging methods

Every method accepts `(message, event, context?)`. Always pass the most specific `LogEvent` for the domain:

```ts
this.logger.log('Usuario creado',       LogEvent.USER,       MyService.name);
this.logger.warn('Token expirado',      LogEvent.AUTH,       MyService.name);
this.logger.error('Fallo en DB', LogEvent.DATABASE, MyService.name, error.stack);
this.logger.debug('Payload recibido',   LogEvent.HTTP,       MyService.name);
this.logger.verbose('Query ejecutada',  LogEvent.DATABASE,   MyService.name);
```

### Available `LogEvent` categories

| Event | Use for |
|---|---|
| `LogEvent.BOOTSTRAP` | App startup |
| `LogEvent.DATABASE` | DB connections, slow queries |
| `LogEvent.HTTP` | Requests / responses |
| `LogEvent.AUTH` | Login, registration, tokens |
| `LogEvent.RESTAURANT` | Restaurant CRUD |
| `LogEvent.USER` | User CRUD |
| `LogEvent.ORDER` | Orders |
| `LogEvent.SECURITY` | Unauthorized access attempts |
| `LogEvent.VALIDATION` | DTO validation errors |
| `LogEvent.SYSTEM` | Generic / fallback |

### Rules

- Always pass `ClassName.name` (or a descriptive string) as the `context` third argument.
- Use `LogEvent.SECURITY` (not `HTTP`) for 401/403 errors.
- Use `LogEvent.SYSTEM` only as a last resort when no other category fits.
- In production, only `SECURITY`, `SYSTEM`, and `AUTH` events are logged by default — don't rely on `HTTP` or `DATABASE` logs being visible in prod.

## Error Handling

This app has a typed error propagation system. **Never throw raw `Error` objects or Nest's built-in exceptions from service/domain code** — use the classes in `src/common/errors/` so the global filter can log them with the right category and return a consistent HTTP response.

### How it works

The `AllExceptionsFilter` (registered globally in `main.ts`) catches every unhandled exception and classifies it in this order:

1. **`AppError` subclass** → reads `statusCode`, `logEvent`, and `logLevel` from the error itself — no extra config needed.
2. **`HttpException` (Nest built-ins)** → still supported; use only in controllers, never in services.
3. **`QueryFailedError` (TypeORM)** → automatically maps PostgreSQL error codes to HTTP status (23505 → 409, 23503 → 409, etc.) and logs with `LogEvent.DATABASE`.
4. **Unknown `Error`** → 500 with `LogEvent.SYSTEM`.

### Available error classes

Import from `'../common/errors/index.js'`:

```ts
import {
  ResourceNotFoundError,
  ConflictDomainError,
  ForbiddenDomainError,
  UnprocessableError,
  DatabaseError,
  ExternalServiceError,
} from '../common/errors/index.js';
```

| Class | HTTP | logLevel | logEvent (default) | When to use |
|---|---|---|---|---|
| `ResourceNotFoundError` | 404 | warn | SYSTEM (override via constructor) | Entity not found in DB |
| `ConflictDomainError` | 409 | warn | SYSTEM (override via constructor) | Duplicate slug, business rule conflict |
| `ForbiddenDomainError` | 403 | warn | SECURITY (fixed) | Business-level authorization failure |
| `UnprocessableError` | 422 | warn | VALIDATION (fixed) | Domain validation beyond DTO |
| `DatabaseError` | 500 | error | DATABASE (fixed) | Wrap unexpected TypeORM errors |
| `ExternalServiceError` | 502 | error | SYSTEM (fixed) | Third-party API failure |

### Usage in services

Always pass the domain's `LogEvent` so the filter logs it in the right category:

```ts
import { ResourceNotFoundError, ConflictDomainError, DatabaseError } from '../common/errors/index.js';
import { LogEvent } from '../common/logger/index.js';

// 404 — logged as RESTAURANT
throw new ResourceNotFoundError('Restaurante no encontrado', LogEvent.RESTAURANT);

// 409 — logged as RESTAURANT
throw new ConflictDomainError(`El slug "${slug}" ya está en uso`, LogEvent.RESTAURANT);

// 403 — always logged as SECURITY
throw new ForbiddenDomainError('Solo el dueño puede modificar este restaurante');

// Wrap an unexpected infrastructure error — logged as DATABASE with stack trace
throw new DatabaseError('No se pudo guardar el restaurante', originalError);

// External API — logged as SYSTEM with stack trace
throw new ExternalServiceError('Timeout al procesar pago', 'Stripe', originalError);
```

### Rules

- **Services and domain code**: always throw `AppError` subclasses. Never throw Nest's `NotFoundException`, `ConflictException`, etc. from a service — those are HTTP concepts.
- **Controllers**: may throw `HttpException` subclasses if truly needed, but prefer delegating to the service.
- **Never wrap errors with `try/catch` just to re-throw as 500** — let the filter handle unknown errors automatically.
- TypeORM unique-constraint violations (23505) are caught automatically; only use `DatabaseError` when you need to add context or the error is from a custom query.

## Production data: NestJS Observe

This app's production telemetry - traces, errors, logs and metrics - goes to [NestJS Observe](https://observe.nestjs.com). Until `ObserveModule` is registered in `src/app.module.ts`, nothing is sent: `npx @nestjs/observe link` sets it up in one step - it installs `@nestjs/observe`, wires it into the app, and writes the key pair (`OBSERVE_APP_KEY`, `OBSERVE_APP_SECRET`) to `.env`.

When a task depends on how the app behaves in production - an error users hit, a slow endpoint, a failing job, whether a release made things worse - work from that data, not from the code alone:

- The Observe MCP server answers those questions directly: errors with their traces and logs, slow operations, jobs, and what a release changed (`find_regressions`, `diff_release`). It is included on the Pro plan and above. In Claude Code: `claude mcp add observe --transport http https://observe-api.nestjs.com/mcp`, and the client opens a browser to approve. Other clients: https://www.observe.nestjs.com/documentation/mcp
- Without it, the user can open the request or error in the Observe dashboard and click **Copy agent prompt**, which hands over that page's trace, stack and logs as text.
