# Coding Standards — MyEasyHand Platform

## General Principles

1. **Clean Architecture** — strict layer separation, dependencies point inward
2. **DRY** — reuse via shared packages where appropriate
3. **SOLID** — single responsibility per module/class
4. **Type Safety** — strict TypeScript, no `any` unless documented
5. **Security First** — validate all inputs, sanitize outputs, audit sensitive actions

## TypeScript

- `strict: true` in all `tsconfig.json`
- Use interfaces for API contracts, types for unions/primitives
- Prefer `async/await` over raw promises
- Use path aliases: `@/modules`, `@/common`, `@/config`

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files | kebab-case | `auth.service.ts` |
| Classes | PascalCase | `AuthService` |
| Functions | camelCase | `createBooking` |
| Constants | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| DB collections | snake_case plural | `booking_status_history` |
| API routes | kebab-case | `/service-categories` |
| Env vars | UPPER_SNAKE | `JWT_ACCESS_SECRET` |

## Git Commit Messages

```
type(scope): description

feat(auth): add OTP verification endpoint
fix(bookings): resolve timezone issue in scheduling
docs(api): update swagger for payments module
chore(ci): add staging deploy workflow
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

## API Design

- RESTful, versioned (`/api/v1`)
- Consistent response envelope
- Pagination: `?page=1&limit=20&sort=-createdAt`
- Filtering: `?status=active&businessId=xxx`
- HTTP status codes: 200, 201, 400, 401, 403, 404, 422, 429, 500

## Error Handling

```typescript
throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
```

## Testing

- Unit tests for services and validators
- Integration tests for API routes
- Minimum 70% coverage on critical paths (auth, bookings, payments)

## Frontend (Next.js / React Native)

- Feature-based folder structure
- React Query for server state, Zustand/Redux for client state
- ShadCN UI for web components
- No inline styles — use Tailwind classes
- Lazy load heavy components

## Security Checklist

- [ ] Helmet headers configured
- [ ] Rate limiting on auth endpoints
- [ ] Input validation with Joi/Zod
- [ ] XSS sanitization
- [ ] JWT secrets rotated in production
- [ ] File upload type/size validation
- [ ] Audit logs for admin actions
- [ ] CORS whitelist only

## Code Review Checklist

- [ ] Types complete, no `any`
- [ ] Error cases handled
- [ ] Tenant isolation enforced
- [ ] RBAC permissions checked
- [ ] Tests added/updated
- [ ] `.env.example` updated if new vars
- [ ] Swagger docs updated
