# React Module Federation Rules

## Technology Stack

- **Module Federation** with Vite for micro-frontend architecture
- **Feature-based folder structure** (bulletproof-react)
- **GraphQL** with codegen for type-safe API layer
- **Zustand** for application state (UI, preferences)
- **React Query** (`@tanstack/react-query`) for server state (API data)
- **React Hook Form** for form state
- **Playwright** for E2E testing, **Vitest** for unit testing
- **DOMPurify** for input sanitization
- **Stytch** (or configured provider) for authentication

## Architectural Rules

1. Features are independent, self-contained modules — no cross-feature imports
2. Unidirectional data flow: App -> Features, never Features -> App
3. Features may only import from shared modules: `components/`, `hooks/`, `lib/`, `utils/`
4. ESLint `import/no-restricted-paths` enforces feature boundaries
5. Functional components only — no class components
6. Use `type` over `interface` for TypeScript definitions
7. Strict TypeScript mode enabled, no `any` types

## Project Structure

```
[module-name]-main-uix/
├── src/
│   ├── app/                    # Application composition layer
│   ├── components/             # Shared components (auth/, layouts/, ui/)
│   ├── config/                 # Configuration
│   ├── entryPoints/            # Module Federation exports
│   ├── features/               # Feature modules (ISOLATED)
│   │   └── [feature]/
│   │       ├── api/            # GraphQL + React Query hooks
│   │       ├── components/     # Feature components
│   │       ├── hooks/          # Feature hooks
│   │       ├── stores/         # Zustand stores
│   │       ├── types/          # TypeScript types
│   │       └── utils/          # Feature utilities
│   ├── graphql/
│   │   ├── generated/          # Codegen output (do not edit)
│   │   ├── queries/            # .graphql files
│   │   └── client.ts
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Core libraries
│   ├── stores/                 # Global Zustand stores
│   ├── types/                  # Shared types
│   └── utils/                  # Shared utilities
└── e2e/                        # Playwright tests
```

## Prohibited Patterns

- **No cross-feature imports** — move shared code to `src/components/` or `src/hooks/`
- **No barrel exports** — use direct imports, not `index.ts` re-exports
- **No Context API for state** — use Zustand for app state, React Query for server state
- **No Redux, MobX, or other state libraries**
- **No manual fetch/useEffect for API calls** — use React Query hooks wrapping GraphQL
- **No snapshot tests** — brittle, low value
- **No `any` types** — use proper TypeScript typing
- **No inline GraphQL** — operations go in `.graphql` files with codegen

## State Management Rules

| State Type | Tool | Examples |
|---|---|---|
| App/UI state | Zustand | Modals, theme, sidebars, user preferences |
| Server state | React Query | API data, caching, refetching, optimistic updates |
| Form state | React Hook Form | Validation, multi-step forms, form data |
| Local component state | `useState` | Simple toggles, tooltips, dropdowns |

## Module Federation

- Share `react`, `react-dom`, `@tanstack/react-query`, `react-router-dom`, `zustand`, `@fullbay/forge` as singletons
- Configure runtime CSS plugin to prevent style leaking between modules
- Wrap entry points with `QueryClientProvider`, `ProtectedRoute`, and `Suspense`

## GraphQL

- Operations in `src/graphql/queries/*.graphql`
- Run codegen to generate types in `src/graphql/generated/`
- Wrap GraphQL calls in React Query hooks inside `features/[name]/api/`
- Always use generated types — never manually type API responses

## Testing

- **Unit tests**: Vitest — test behavior, not implementation
- **E2E tests**: Playwright — test user workflows
- **API tests**: Use type-safe object assertions (not individual field checks)
- **API mocking**: Use MSW (Mock Service Worker) for mocking GraphQL/REST in tests
- **Test data**: Faker.js builders with `Partial` overrides
- **Structure**: Follow AAA pattern (Arrange/Act/Assert)
- No snapshot tests

### Testing Library Query Priority

Use the most accessible query available, in this order:

1. `getByRole` — most accessible, preferred for interactive elements
2. `getByLabelText` — forms
3. `getByText` — non-interactive content
4. `getByTestId` — last resort only

### Testing Anti-Patterns

- **Don't test implementation details** — test what the user sees, not internal state
- **Don't over-mock** — only mock external dependencies (APIs, services), not child components
- **Don't use brittle selectors** — no CSS class selectors (`.btn-primary`), use accessible queries
- **Don't test third-party libraries** — test your integration with them, not the library itself
- **Don't test generated code** — GraphQL types, codegen output

### Test Isolation

- Reset Zustand stores in `beforeEach` via `useStore.setState(initialState)`
- Wrap React Query tests with `QueryClientProvider` using `retry: false`

## Security

- Sanitize user input with DOMPurify before rendering
- Use `ProtectedRoute` with role/permission checks for protected views
- Auth tokens via configured provider (Stytch) — no manual token management
- No secrets in code — use `.env` for configuration
- Wrap features in error boundaries with fallback UI

## Performance

- Lazy load features with `React.lazy()` and `Suspense`
- Use `React.memo` for expensive components
- Use `useMemo`/`useCallback` where re-render cost is measurable
- Configure React Query stale/gc times appropriately (default: 5min stale, 10min gc)

## Decision Guide

- **Feature or shared?** — If used by one feature, keep in feature. If used by multiple, move to shared.
- **Share data between features?** — Don't. Lift to app level or global store only if truly necessary.
- **REST or GraphQL?** — Prefer GraphQL. If REST is needed, still use React Query hooks.
