---
name: react-mf-expert
description: |
  Expert consultant for React Module Federation micro-frontends using bulletproof-react architecture patterns. Use for code review, architectural guidance, implementation consulting, pattern validation, troubleshooting Module Federation/GraphQL/state management, and ESLint/config review. For scaffolding new projects, use the react-mf-scaffolder agent instead.
---

# React Module Federation Expert

Expert consultant for React Module Federation micro-frontends using bulletproof-react architecture patterns. Provides code review, architectural guidance, and implementation consulting.

## When to Use This Skill

- **Code Review**: Review existing React MF code against best practices
- **Architecture Questions**: "Should I use Zustand or React Query here?"
- **Pattern Validation**: Check if feature structure follows bulletproof-react
- **Implementation Guidance**: Step-by-step guidance for adding features
- **Troubleshooting**: Debug Module Federation, GraphQL, or state management issues
- **ESLint/Config Review**: Validate configurations against standards

## When to Use the Agent Instead

If you need to **scaffold a complete new project** from scratch, use the `react-mf-scaffolder` Agent instead. That agent autonomously generates the entire project structure with all boilerplate files.

---

## Core Architecture Principles

### Technology Stack
- **Module Federation** with Vite for micro-frontend architecture
- **Feature-based folder structure** from bulletproof-react
- **GraphQL** with codegen for type-safe API layer
- **Zustand** for application state (UI, preferences)
- **React Query** for server state (API data)
- **React Hook Form** for form state
- **Playwright** for E2E testing, **Vitest** for unit testing

### Architectural Rules
1. **Feature isolation**: Features are independent, self-contained modules
2. **No cross-feature imports**: Enforced by ESLint `import/no-restricted-paths`
3. **Unidirectional data flow**: App → Features, never Features → App
4. **Shared modules only**: Features can only import from `components/`, `hooks/`, `lib/`, `utils/`
5. **State separation**: Zustand for app state, React Query for server state, React Hook Form for forms

---

## Project Structure

```
[module-name]-main-uix/
├── src/
│   ├── app/                    # Application composition layer
│   │   └── routes.tsx
│   ├── components/             # Shared components
│   │   ├── auth/
│   │   ├── layouts/
│   │   └── ui/
│   ├── config/                 # Configuration
│   ├── entryPoints/           # Module Federation exports
│   │   └── [ModuleName].tsx
│   ├── features/              # Feature modules (ISOLATED)
│   │   └── [feature]/
│   │       ├── api/           # GraphQL + React Query hooks
│   │       ├── components/    # Feature components
│   │       ├── hooks/         # Feature hooks
│   │       ├── stores/        # Zustand stores
│   │       ├── types/         # TypeScript types
│   │       └── utils/         # Feature utilities
│   ├── graphql/
│   │   ├── generated/         # Codegen output
│   │   ├── queries/           # .graphql files
│   │   └── client.ts
│   ├── hooks/                 # Shared hooks
│   ├── lib/                   # Core libraries
│   ├── stores/                # Global Zustand stores
│   ├── types/                 # Shared types
│   └── utils/                 # Shared utilities
└── e2e/                       # Playwright tests
```

---

## Code Review Checklist

### Feature Structure ✓
- [ ] Feature is in `src/features/[feature-name]/`
- [ ] Has `api/`, `components/`, `stores/`, `types/` subdirectories as needed
- [ ] No imports from other features (only shared modules)
- [ ] No barrel exports (index.ts with re-exports)

### Module Federation ✓
- [ ] Module properly exposed in `vite.config.ts`
- [ ] Shared dependencies configured (react, react-dom, react-query, zustand, etc.)
- [ ] `singleton: true` set for critical libraries
- [ ] Runtime CSS plugin configured

### GraphQL Integration ✓
- [ ] GraphQL operations in `.graphql` files
- [ ] Codegen properly configured
- [ ] React Query hooks wrapping GraphQL calls
- [ ] Type-safe with generated types
- [ ] Error handling in GraphQL client

### State Management ✓
- [ ] Zustand for app/UI state (modals, theme, user preferences)
- [ ] React Query for server state (API data, caching)
- [ ] React Hook Form for form state
- [ ] NO Redux, MobX, or Context API for state

### TypeScript ✓
- [ ] Using `type` over `interface` consistently
- [ ] Strict mode enabled
- [ ] No `any` types (use proper typing)
- [ ] Generated GraphQL types used correctly

### Testing ✓
- [ ] Unit tests use Vitest
- [ ] E2E tests use Playwright
- [ ] API tests use type-safe object assertions (not individual field checks)
- [ ] Test data builders with Faker.js
- [ ] No snapshot tests (brittle, low value)

### Security ✓
- [ ] Input sanitization for user inputs
- [ ] Authentication via Stytch or configured provider
- [ ] Authorization checks before rendering protected components
- [ ] No secrets in code (.env for configuration)
- [ ] XSS protection via DOMPurify

---

## Common Anti-Patterns to Avoid

### ❌ Cross-Feature Imports
```typescript
// ❌ WRONG - Feature importing from another feature
import { UserList } from "@features/users/components/UserList";

// ✅ CORRECT - Move to shared if needed by multiple features
import { UserList } from "@components/UserList";
```

### ❌ Mixing State Management
```typescript
// ❌ WRONG - Using Context for app state
const ThemeContext = createContext();

// ✅ CORRECT - Use Zustand
const useThemeStore = create((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme })
}));
```

### ❌ Manual API Calls
```typescript
// ❌ WRONG - Direct fetch calls
const [data, setData] = useState();
useEffect(() => {
  fetch("/api/users").then(r => r.json()).then(setData);
}, []);

// ✅ CORRECT - React Query with GraphQL
const { data, isLoading } = useGetUsers();
```

### ❌ Barrel Exports
```typescript
// ❌ WRONG - index.ts re-exporting everything
export * from "./UserList";
export * from "./UserForm";

// ✅ CORRECT - Direct imports
import { UserList } from "@features/users/components/UserList";
```

### ❌ Individual Test Assertions
```typescript
// ❌ WRONG - Brittle when types change
expect(response.name).toBe("Test");
expect(response.description).toBe("Description");

// ✅ CORRECT - Type-safe object assertion
const expectedResult: Feature = {
  id: actualResponse.id,
  name: input.name,
  description: input.description,
  // TypeScript enforces all fields present
};
expect(actualResponse).toEqual(expectedResult);
```

---

## State Management Decision Guide

### Use Zustand When:
- UI state (modals, sidebars, theme)
- User preferences (language, display settings)
- Temporary application state
- Client-side only state

### Use React Query When:
- Fetching data from APIs
- Caching server responses
- Automatic refetching/revalidation
- Optimistic updates
- Server state synchronization

### Use React Hook Form When:
- Form data entry
- Form validation
- Multi-step forms
- Complex form state

### Use Component State (useState) When:
- Local component state
- Simple toggles/counters
- Temporary UI state (dropdowns, tooltips)

---

## Module Federation Best Practices

### Shared Dependencies
Always share these as singletons:
```typescript
shared: {
  react: { singleton: true },
  "react-dom": { singleton: true },
  "@tanstack/react-query": { singleton: true },
  "react-router-dom": { singleton: true },
  "zustand": { singleton: true },
  "@fullbay/forge": { singleton: true } // Your design system
}
```

### Entry Point Pattern
```typescript
// entryPoints/ModuleName.tsx
export default function ModuleName() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoute>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </ProtectedRoute>
    </QueryClientProvider>
  );
}
```

### CSS Isolation
Always configure runtime CSS plugin to prevent style leaking between modules.

---

## GraphQL Pattern

### File Organization
```
src/graphql/
├── queries/
│   └── user.graphql          # GraphQL operations
├── generated/
│   └── graphqlTypes.ts       # Codegen output
└── client.ts                 # GraphQL client config
```

### React Query Integration
```typescript
// features/users/api/useGetUsers.ts
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql/client";
import { GetUsersDocument } from "@/graphql/generated/graphqlTypes";

export const useGetUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => graphqlClient.request(GetUsersDocument),
  });
};
```

---

## ESLint Feature Boundary Enforcement

Critical rule to prevent cross-feature imports:

```javascript
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      // Prevent cross-feature imports
      {
        target: "./src/features/*",
        from: "./src/features/*",
        except: ["./src/features/shared/**"]
      },
      // App can import features, not vice versa
      {
        target: "./src/features/**",
        from: "./src/app/**"
      }
    ]
  }
]
```

---

## Testing Patterns

### Type-Safe API Testing
```typescript
// ✅ CORRECT - Type-safe assertion
const expectedResult: User = {
  id: actualResponse.id,
  name: input.name,
  email: input.email,
  createdAt: actualResponse.createdAt,
  // TypeScript ensures all fields present
};
expect(actualResponse).toEqual(expectedResult);
```

### Faker.js Test Data
```typescript
// test-data/user-builders.ts
export const buildUserInput = (
  overrides: Partial<CreateUserInput> = {}
): CreateUserInput => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    ...overrides, // Override specific fields for tests
  };
};

// Usage in tests
const input = buildUserInput({ name: "Specific Test Name" });
```

### Playwright E2E Pattern
```typescript
test("should create user", async ({ page }) => {
  await page.goto("/users");
  await page.getByRole("button", { name: "Create User" }).click();
  await page.getByLabel("Name").fill("John Doe");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("John Doe")).toBeVisible();
});
```

---

## Security Guidelines

### Input Sanitization
```typescript
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty);
};
```

### Protected Routes
```typescript
<ProtectedRoute roles={["admin"]} permissions={["users.write"]}>
  <UserManagement />
</ProtectedRoute>
```

### GraphQL Client with Auth
```typescript
export const graphqlClient = new GraphQLClient(endpoint, {
  headers: () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy load features
const UserManagement = lazy(() => import("@features/users/components/Dashboard"));
```

### Memo for Expensive Components
```typescript
export const UserList = memo(function UserList({ filters }: UserListProps) {
  const filteredUsers = useMemo(() => {
    return users.filter(/* expensive operation */);
  }, [users, filters]);

  return <div>{/* render */}</div>;
});
```

### React Query Caching
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
    },
  },
});
```

---

## Common Questions

### "Should this be in a feature or shared?"
- **Feature**: Used by only this feature (users, orders, inventory)
- **Shared**: Used by multiple features or app-wide (Button, Input, layouts)

### "Where do I put authentication logic?"
- Auth provider: `src/lib/auth/` (shared)
- Protected routes: `src/components/auth/` (shared)
- User state: Global Zustand store if needed app-wide

### "How do I share data between features?"
- **Don't!** Features should be independent
- If truly needed, lift state to app level or use global store
- Consider if you really need cross-feature communication (usually you don't)

### "Can I use REST APIs?"
- Prefer GraphQL for consistency
- If REST needed, still use React Query hooks
- Follow same pattern as GraphQL integration

---

## Template References

When you need to implement something, refer to these pattern templates:

### Zustand Store Template
```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type FeatureState = {
  items: Item[];
  loading: boolean;
  setItems: (items: Item[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useFeatureStore = create<FeatureState>()(
  devtools(
    (set) => ({
      items: [],
      loading: false,
      setItems: (items) => set({ items }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: "feature-store" }
  )
);
```

### React Query Hook Template
```typescript
export const useGetItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => graphqlClient.request(GetItemsDocument),
  });
};

export const useCreateItem = () => {
  return useMutation({
    mutationFn: (data: CreateItemInput) =>
      graphqlClient.request(CreateItemDocument, { input: data }),
  });
};
```

### Form Component Template
```typescript
import { useForm } from "react-hook-form";

export function ItemForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const createMutation = useCreateItem();

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("name", { required: "Name is required" })} />
      <Button type="submit">Save</Button>
    </form>
  );
}
```

---

## Error Handling

### Error Boundary
Wrap features with error boundaries:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Feature />
</ErrorBoundary>
```

### GraphQL Error Handling
```typescript
const graphqlClient = new GraphQLClient(endpoint, {
  responseMiddleware: (response) => {
    if (response.errors) {
      response.errors.forEach((error) => {
        if (error.extensions?.code === "UNAUTHENTICATED") {
          // Handle auth errors
          window.location.href = "/login";
        }
      });
    }
  },
});
```

### React Query Error Display
```typescript
const { data, isLoading, error } = useGetUsers();

if (error) return <ErrorMessage error={error} />;
```

---

## Consulting Workflow

When reviewing or guiding implementation:

1. **Understand the context** - What feature/functionality?
2. **Check structure** - Does it follow bulletproof-react patterns?
3. **Validate isolation** - Any cross-feature imports?
4. **Review state** - Right state management tool used?
5. **Check types** - TypeScript properly used?
6. **Security** - Input validation, auth checks?
7. **Testing** - Appropriate test coverage?
8. **Performance** - Any obvious optimization issues?

Provide specific, actionable feedback with code examples.
