# Java/Quarkus Rules

## Technology Stack

- **Framework**: Quarkus (latest stable)
- **Build System**: Gradle with Gradle Wrapper
- **Linting/Formatting**: Spotless with Google Java Style Guide
- **Testing**: JUnit 5, AssertJ (not JUnit assertions), Mockito, Faker for test data
- **Quarkus Testing**: `@QuarkusTest`, `@QuarkusIntegrationTest`, `@InjectMock`
- **Logging**: SLF4J
- **Monitoring**: SmallRye Health, Micrometer (Prometheus)
- **Repositories**: Panache (recommended for new projects)

## Architectural Rules

1. **Package-by-feature**, not package-by-layer
2. Proper separation: Resource -> Service -> Repository
3. Constructor injection preferred over field injection
4. Never expose JPA entities in REST — use DTOs with mappers
5. Interfaces not required for services (Quarkus CDI proxies work on concrete classes)
6. Use `@Transactional` on service methods for write operations

## Package Structure

```
com.company.projectname/
├── users/
│   ├── User.java                    # Entity
│   ├── UserResource.java            # REST endpoint
│   ├── UserService.java             # Business logic
│   ├── UserRepository.java          # Data access (Panache)
│   ├── UserDto.java                 # DTOs (Create, Update, Response)
│   └── UserMapper.java              # Entity <-> DTO mapping
├── orders/
│   └── ...
└── shared/                          # Shared utilities
    ├── exceptions/
    ├── validation/
    └── config/
```

## Code Standards

- **Classes**: `CamelCase` — **max 500 lines**
- **Methods/Variables**: `camelCase` — **max 50 lines per method**
- **Constants**: `UPPER_SNAKE_CASE`
- **Test Classes**: `[ClassName]Test`
- **Cyclomatic complexity**: max 10 per method
- **Javadoc**: required on all public classes and methods
- **Formatting**: `./gradlew spotlessApply` before committing

## Prohibited Patterns

- **No package-by-layer** — use package-by-feature
- **No exposing entities in REST** — use DTOs
- **No `new` for managed beans** — use `@Inject`
- **No JUnit assertions** — use AssertJ (`assertThat`)
- **No swallowed exceptions** — log and rethrow or handle properly
- **No hardcoded configuration** — use `@ConfigProperty` and environment variables
- **No string concatenation in queries** — use parameterized queries (prevent SQL injection)
- **No catching generic `Exception`** — catch specific exception types

## REST API Design

| Operation | Method | Success Code | Response Body |
|---|---|---|---|
| Get single | GET | 200 | Entity |
| Get list | GET | 200 | Array |
| Create | POST | 201 | Created entity |
| Update (full) | PUT | 200 | Updated entity |
| Update (partial) | PATCH | 200 | Updated entity |
| Delete | DELETE | 204 | None |

- Use `@Valid` with Bean Validation (`@NotNull`, `@Size`, `@Email`) on DTOs at API boundary
- Use `@Produces`/`@Consumes` with `APPLICATION_JSON`
- Version APIs: `/api/v1/resource`

## Dependency Injection

- **`@ApplicationScoped`**: Singleton, shared across app (default for services)
- **`@RequestScoped`**: New instance per HTTP request
- **`@Dependent`**: New instance at each injection point
- **`@Singleton`**: Eager initialization at startup
- Constructor injection preferred; field injection acceptable for simple cases

## Exception Handling

- Custom exception classes for business logic (e.g., `UserNotFoundException`)
- `ExceptionMapper` (`@Provider`) for translating exceptions to HTTP responses
- Map business exceptions to appropriate status codes (404, 400, etc.)
- Generic 500 for unexpected errors — never expose internals to client

## Testing

- **Assertions**: AssertJ only — fluent, readable (`assertThat(...).isEqualTo(...)`)
- **Mocking**: Mockito (`@Mock`, `@InjectMocks`)
- **Unit tests**: Service layer with mocked dependencies
- **Integration tests**: REST endpoints with `@QuarkusTest` and REST Assured
- **Test data**: Faker for realistic data generation
- **Structure**: AAA pattern (Arrange/Act/Assert)

### Test Naming Convention

Use `@DisplayName` with three-part format: **`method - scenario - expected`**

```
"getAll - valid request with items - should return list of items with 200 status"
"create - invalid input with null name - should throw ValidationException"
"delete - valid id with existing record - should remove entity and return 204"
```

## Configuration

- Profile-specific configs: `%dev.`, `%test.`, `%prod.` prefixes in `application.properties`
- Sensitive data via environment variables with defaults: `${DB_PASSWORD:secret}`
- Inject with `@ConfigProperty(name = "key", defaultValue = "fallback")`

## Logging

- SLF4J with `LoggerFactory.getLogger(ClassName.class)`
- Use parameterized messages: `logger.info("Creating user: {}", email)`
- **ERROR**: System errors requiring attention
- **WARN**: Degraded functionality
- **INFO**: Business events, lifecycle
- **DEBUG**: Detailed flow for debugging
- Never log sensitive data (passwords, tokens, PII)

## Security

- Input validation via Bean Validation (`@Valid`) at API boundary
- Parameterized queries only — no string concatenation
- `@RolesAllowed` / `@Authenticated` for endpoint security
- Secrets in environment variables, never in code
- CORS configured in `application.properties`
- Follow OWASP Top 10
