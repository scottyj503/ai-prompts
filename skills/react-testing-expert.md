---
name: react-testing-expert
description: |
  Expert consultant for comprehensive React testing strategies covering unit tests (Vitest), integration tests (React Testing Library), E2E tests (Playwright), and API tests (GraphQL). Use for testing strategy, mocking patterns, test data generation with Faker.js, coverage guidance, and debugging failing tests.
model: sonnet
---

# React Testing Expert

Expert consultant for comprehensive React testing strategies covering unit tests, integration tests, E2E tests, and API tests. Specializes in Vitest, React Testing Library, Playwright, and type-safe GraphQL testing.

## When to Use This Skill

- **Unit Testing**: Test components, hooks, utilities in isolation
- **Integration Testing**: Test component interactions and data flow
- **E2E Testing**: Test complete user flows and critical paths
- **API Testing**: Test GraphQL operations with type-safe assertions
- **Test Strategy**: Decide what to test and how to test it
- **Mocking**: Mock APIs, modules, external dependencies
- **Test Data**: Generate realistic test data with Faker.js
- **Coverage**: Achieve meaningful test coverage
- **Debugging**: Troubleshoot failing tests

## Testing Philosophy

**CRITICAL**: Write tests that provide value, not just coverage percentage.

### Test Priority Pyramid

```
         /\
        /E2E\         Few, critical user flows
       /------\
      /  Integ \      More, feature interactions
     /----------\
    /    Unit    \    Most, isolated logic
   /--------------\
```

**Focus**: More unit tests, fewer E2E tests. Integration tests bridge the gap.

---

## Testing Stack

### Unit & Integration Testing
- **Test Runner**: Vitest (fast, Vite-native)
- **Component Testing**: React Testing Library
- **Assertions**: Vitest assertions + Testing Library queries
- **Mocking**: `vi.mock()`, MSW (Mock Service Worker)
- **Coverage**: Vitest coverage (c8)

### E2E Testing
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Assertions**: Playwright expect
- **Configuration**: Multi-browser, parallel execution

### API Testing
- **GraphQL Client**: graphql-request
- **Type Safety**: Generated types from GraphQL codegen
- **Assertions**: Type-safe object assertions
- **Test Data**: Faker.js builders

---

## Unit Testing with Vitest

### Testing Components

**Basic Component Test**:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('should render user information correctly', () => {
    // Arrange
    const user = { name: 'John Doe', email: 'john@example.com' };

    // Act
    render(<UserCard user={user} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display placeholder when no user provided', () => {
    render(<UserCard user={null} />);
    expect(screen.getByText('No user selected')).toBeInTheDocument();
  });
});
```

**Testing User Interactions**:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should call onSubmit with form data when submitted', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    // Act
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // Assert
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});
```

### Testing Custom Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    result.current.increment();
    expect(result.current.count).toBe(1);

    result.current.increment();
    expect(result.current.count).toBe(2);
  });

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5));

    result.current.decrement();
    expect(result.current.count).toBe(4);
  });

  it('should reset counter to initial value', () => {
    const { result } = renderHook(() => useCounter(5));

    result.current.increment();
    result.current.increment();
    expect(result.current.count).toBe(7);

    result.current.reset();
    expect(result.current.count).toBe(5);
  });
});
```

### Testing Async Operations

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('should display loading state initially', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display user data after loading', async () => {
    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    // Mock API failure
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load user')).toBeInTheDocument();
    });
  });
});
```

---

## Integration Testing

### Testing with React Query

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { UserList } from './UserList';

describe('UserList Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }, // Disable retries in tests
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch and display users', async () => {
    render(<UserList />, { wrapper });

    // Loading state
    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle empty user list', async () => {
    // Mock empty response
    render(<UserList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });
});
```

### Testing with Zustand Stores

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import { ShoppingCart } from './ShoppingCart';

describe('ShoppingCart with Zustand', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], total: 0 });
  });

  it('should add item to cart', async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);

    await user.click(screen.getByText('Add to Cart'));

    expect(screen.getByText('Items: 1')).toBeInTheDocument();
  });

  it('should remove item from cart', async () => {
    const user = userEvent.setup();

    // Pre-populate cart
    useCartStore.setState({
      items: [{ id: '1', name: 'Product', quantity: 1 }],
      total: 1
    });

    render(<ShoppingCart />);

    await user.click(screen.getByText('Remove'));

    expect(screen.getByText('Items: 0')).toBeInTheDocument();
  });
});
```

### Testing React Router Navigation

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Navigation } from './Navigation';
import { Home } from './Home';
import { About } from './About';

describe('Navigation', () => {
  it('should navigate to about page', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><Navigation /><Home /></>} />
          <Route path="/about" element={<><Navigation /><About /></>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'About' }));

    expect(screen.getByText('About Page')).toBeInTheDocument();
  });
});
```

---

## Mocking Strategies

### Mocking Modules with vi.mock()

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserDashboard } from './UserDashboard';

// Mock the entire module
vi.mock('./userService', () => ({
  fetchUser: vi.fn(() => Promise.resolve({
    id: '1',
    name: 'Test User',
    email: 'test@example.com'
  }))
}));

describe('UserDashboard', () => {
  it('should display user from mocked service', async () => {
    render(<UserDashboard userId="1" />);

    expect(await screen.findByText('Test User')).toBeInTheDocument();
  });
});
```

### Mocking GraphQL with MSW (Mock Service Worker)

```typescript
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserList } from './UserList';

const server = setupServer(
  graphql.query('GetUsers', () => {
    return HttpResponse.json({
      data: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
        ]
      }
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserList with MSW', () => {
  it('should display users from GraphQL API', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      graphql.query('GetUsers', () => {
        return HttpResponse.json({
          errors: [{ message: 'Internal server error' }]
        });
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });
});
```

### Mocking Environment Variables

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Config', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    import.meta.env = {
      ...originalEnv,
      VITE_API_URL: 'https://test-api.example.com'
    };
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('should use test API URL', () => {
    expect(import.meta.env.VITE_API_URL).toBe('https://test-api.example.com');
  });
});
```

---

## E2E Testing with Playwright

### Basic E2E Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.getByRole('link', { name: 'Login' }).click();

    // Fill form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/');
  });
});
```

### Page Object Pattern

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// Using the Page Object
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('should login with page object', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

### Testing Forms and Interactions

```typescript
test('should create new user with valid data', async ({ page }) => {
  await page.goto('/users/new');

  // Fill form
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Role').selectOption('admin');
  await page.getByLabel('Active').check();

  // Submit
  await page.getByRole('button', { name: 'Create User' }).click();

  // Verify success
  await expect(page.getByText('User created successfully')).toBeVisible();
  await expect(page).toHaveURL('/users');
  await expect(page.getByText('John Doe')).toBeVisible();
});
```

### API Mocking in E2E Tests

```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Mock API error
  await page.route('**/api/graphql', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [{ message: 'Internal server error' }]
      })
    });
  });

  await page.goto('/users');

  await expect(page.getByText('Failed to load users')).toBeVisible();
});
```

### Waiting Strategies

```typescript
test('should wait for dynamic content', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for specific element
  await page.waitForSelector('[data-testid="user-stats"]');

  // Wait for network idle
  await page.waitForLoadState('networkidle');

  // Wait for specific response
  await page.waitForResponse(resp =>
    resp.url().includes('/api/users') && resp.status() === 200
  );

  // Playwright auto-waits for most actions
  await page.getByRole('button', { name: 'Load More' }).click();
});
```

---

## GraphQL API Testing

### Type-Safe API Testing

```typescript
import { describe, it, expect } from 'vitest';
import { graphqlClient } from '@/lib/graphql/client';
import {
  CreateUserDocument,
  GetUserDocument,
  UpdateUserDocument,
  type User,
  type CreateUserInput,
} from '@/graphql/generated/graphqlTypes';

describe('User API', () => {
  let createdUserId: string;

  it('should create user with type-safe validation', async () => {
    // Arrange
    const input: CreateUserInput = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'USER'
    };

    // Act
    const response = await graphqlClient.request(CreateUserDocument, { input });

    // Assert
    const actualResponse = response.createUser;
    expect(actualResponse).not.toBeNull();

    if (!actualResponse) return;

    // TYPE-SAFE: TypeScript enforces all fields
    const expectedResult: User = {
      id: actualResponse.id,
      name: input.name,
      email: input.email,
      role: input.role,
      createdAt: actualResponse.createdAt,
      updatedAt: actualResponse.updatedAt,
    };

    expect(actualResponse).toEqual(expectedResult);
    createdUserId = actualResponse.id;
  });

  it('should get user by id', async () => {
    const response = await graphqlClient.request(GetUserDocument, {
      id: createdUserId
    });

    expect(response.getUser).not.toBeNull();
    expect(response.getUser?.name).toBe('John Doe');
  });

  it('should handle validation errors', async () => {
    const invalidInput: CreateUserInput = {
      name: '',
      email: 'invalid-email',
      role: 'USER'
    };

    await expect(
      graphqlClient.request(CreateUserDocument, { input: invalidInput })
    ).rejects.toThrow();
  });
});
```

---

## Test Data Builders with Faker.js

### Basic Builder Pattern

```typescript
import { faker } from '@faker-js/faker';
import type { CreateUserInput, User } from '@/types';

export const buildUserInput = (
  overrides: Partial<CreateUserInput> = {}
): CreateUserInput => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 80 }),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement(['USER', 'ADMIN', 'MODERATOR']),
    active: faker.datatype.boolean({ probability: 0.8 }),
    ...overrides, // Apply overrides last
  };
};

export const buildUser = (
  overrides: Partial<User> = {}
): User => {
  return {
    id: faker.string.uuid(),
    ...buildUserInput(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
};

// Usage in tests
it('should create user with realistic data', async () => {
  const input = buildUserInput({
    name: 'Specific Test Name', // Override only what you need
    active: true
  });

  const response = await createUser(input);
  expect(response.name).toBe('Specific Test Name');
  expect(response.email).toMatch(/@/); // Faker generated valid email
});
```

### Test Scenarios

```typescript
export const UserTestScenarios = {
  valid: {
    standard: (): CreateUserInput => buildUserInput({
      role: 'USER',
      active: true
    }),

    admin: (): CreateUserInput => buildUserInput({
      role: 'ADMIN',
      active: true
    }),
  },

  edge: {
    minAge: (): CreateUserInput => buildUserInput({
      age: 18
    }),

    longName: (): CreateUserInput => buildUserInput({
      name: faker.lorem.words(20)
    }),
  },

  invalid: {
    emptyName: (): CreateUserInput => buildUserInput({
      name: ''
    }),

    invalidEmail: (): CreateUserInput => buildUserInput({
      email: 'not-an-email'
    }),
  }
};

// Usage
it('should handle user with minimum age', async () => {
  const input = UserTestScenarios.edge.minAge();
  const response = await createUser(input);
  expect(response.age).toBe(18);
});
```

---

## Testing Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```typescript
// ❌ WRONG - Testing internal state
it('should set loading to true', () => {
  const { result } = renderHook(() => useUsers());
  expect(result.current.isLoading).toBe(true);
});

// ✅ CORRECT - Test user-visible behavior
it('should show loading indicator', () => {
  render(<UserList />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### ❌ Over-Mocking

```typescript
// ❌ WRONG - Mocking everything
vi.mock('./UserCard', () => ({
  UserCard: vi.fn(() => <div>Mocked</div>)
}));

// ✅ CORRECT - Only mock external dependencies
vi.mock('./api/userService');
```

### ❌ Brittle Selectors

```typescript
// ❌ WRONG - Fragile selectors
const button = container.querySelector('.btn-primary.submit-btn');

// ✅ CORRECT - Accessible queries
const button = screen.getByRole('button', { name: 'Submit' });
```

### ❌ Testing Third-Party Libraries

```typescript
// ❌ WRONG - Testing React Query itself
it('should cache data', () => {
  // Testing React Query's caching behavior
});

// ✅ CORRECT - Test your integration with React Query
it('should display cached user data', () => {
  // Test your component using React Query
});
```

### ❌ Snapshot Testing Everything

```typescript
// ❌ WRONG - Snapshots for everything
it('should render correctly', () => {
  const { container } = render(<UserCard user={user} />);
  expect(container).toMatchSnapshot();
});

// ✅ CORRECT - Specific assertions
it('should display user information', () => {
  render(<UserCard user={user} />);
  expect(screen.getByText(user.name)).toBeInTheDocument();
  expect(screen.getByText(user.email)).toBeInTheDocument();
});
```

---

## Testing Best Practices

### ✅ Follow AAA Pattern

```typescript
it('should add item to cart', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<ProductCard product={product} />);

  // Act
  await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

  // Assert
  expect(screen.getByText('Added to cart')).toBeInTheDocument();
});
```

### ✅ Use Descriptive Test Names

```typescript
// ✅ GOOD - Clear what is being tested
it('should display error message when email is invalid', () => {});
it('should disable submit button while form is submitting', () => {});
it('should redirect to dashboard after successful login', () => {});

// ❌ BAD - Vague test names
it('should work', () => {});
it('test login', () => {});
```

### ✅ Test User Behavior, Not Implementation

```typescript
// ✅ CORRECT - Test what user sees/does
it('should show success message after form submission', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(await screen.findByText('Thank you!')).toBeInTheDocument();
});
```

### ✅ Isolate Tests

```typescript
describe('UserList', () => {
  beforeEach(() => {
    // Reset state before each test
    useUserStore.getState().reset();
  });

  it('test 1', () => {
    // This test won't affect test 2
  });

  it('test 2', () => {
    // Clean slate
  });
});
```

### ✅ Use Testing Library Queries Properly

**Query Priority**:
1. `getByRole` - Most accessible
2. `getByLabelText` - Forms
3. `getByPlaceholderText` - If no label
4. `getByText` - Non-interactive content
5. `getByTestId` - Last resort

```typescript
// ✅ BEST - Accessible query
screen.getByRole('button', { name: 'Submit' });

// ✅ GOOD - Label association
screen.getByLabelText('Email');

// ⚠️ OK - When no better option
screen.getByText('Welcome back');

// ❌ LAST RESORT - Adds test-specific markup
screen.getByTestId('submit-button');
```

---

## Coverage Strategy

### What to Test

**✅ DO Test**:
- User interactions and flows
- Business logic and calculations
- Error states and edge cases
- Conditional rendering
- Data transformations
- API integrations

**❌ DON'T Test**:
- Third-party library internals
- Trivial getters/setters
- Constants
- Generated code (GraphQL types)

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/graphql/generated/**',
        '**/types/**',
      ]
    }
  }
});
```

---

## Vitest Configuration

### Basic vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/graphql/generated/']
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### vitest.setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
} as any;
```

---

## Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Common Testing Patterns

### Testing Context Providers

```typescript
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

it('should use theme from context', () => {
  render(<ThemedButton />, { wrapper });
  expect(screen.getByRole('button')).toHaveClass('dark-theme');
});
```

### Testing Error Boundaries

```typescript
it('should catch errors and display fallback', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  // Suppress console.error for this test
  vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Error occurred')).toBeInTheDocument();
});
```

### Testing with Timers

```typescript
it('should show message after delay', async () => {
  vi.useFakeTimers();

  render(<DelayedMessage />);

  expect(screen.queryByText('Hello')).not.toBeInTheDocument();

  vi.advanceTimersByTime(2000);

  expect(screen.getByText('Hello')).toBeInTheDocument();

  vi.useRealTimers();
});
```

---

## Debugging Tests

### Debug Output

```typescript
import { screen, render } from '@testing-library/react';

it('should debug output', () => {
  const { debug } = render(<Component />);

  // Print entire DOM
  debug();

  // Print specific element
  debug(screen.getByRole('button'));

  // Print with max length
  debug(undefined, 20000);
});
```

### Check Available Queries

```typescript
it('should show available queries', () => {
  render(<Component />);

  screen.logTestingPlaygroundURL();
  // Prints URL to testing playground with your DOM
});
```

### Playwright Debug Mode

```bash
# Run in debug mode with inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test user-login.spec.ts --debug

# Take screenshot at specific point
await page.screenshot({ path: 'debug.png' });
```

---

## Testing Workflow

When implementing tests:

1. **Understand what to test** - User behavior, not implementation
2. **Choose test type** - Unit, integration, or E2E?
3. **Write test first** (TDD) or after implementation
4. **Use proper queries** - Accessible queries preferred
5. **Mock sparingly** - Only external dependencies
6. **Test error states** - Don't just test happy path
7. **Run tests locally** - Before committing
8. **Review coverage** - Meaningful, not just percentage

For comprehensive React MF development guidance beyond testing, refer to the **react-mf-expert Skill**.
