# Frontend Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the NGS360 frontend application. Our testing approach follows industry best practices and covers unit tests, component tests, integration tests, and end-to-end testing.

## Tech Stack

- **Test Runner:** Vitest
- **Testing Library:** React Testing Library (@testing-library/react)
- **DOM Testing:** @testing-library/dom, jsdom
- **Mocking:** Vitest's built-in mocking + MSW (Mock Service Worker) for API mocking
- **Coverage:** Vitest's built-in coverage tools

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          (Few - Expensive, Slow)
                 /--------\
                /          \
               / Integration\      (Some - Moderate cost)
              /--------------\
             /                \
            /   Component Tests \  (Many - Fast, Focused)
           /--------------------\
          /                      \
         /      Unit Tests        \ (Most - Very Fast)
        /--------------------------\
```

## Directory Structure

```
frontend-ui/
├── src/
│   ├── __tests__/           # Integration tests
│   │   ├── workflows/
│   │   └── setup.ts
│   ├── components/
│   │   ├── __tests__/       # Component tests
│   │   │   ├── search-bar.test.tsx
│   │   │   ├── create-project-form.test.tsx
│   │   │   └── data-table.test.tsx
│   │   └── ui/
│   │       └── __tests__/   # UI component tests
│   ├── hooks/
│   │   └── __tests__/       # Hook tests
│   │       ├── use-debounce.test.ts
│   │       └── use-all-paginated.test.ts
│   ├── lib/
│   │   └── __tests__/       # Utility tests
│   │       └── utils.test.ts
│   └── test/                # Test utilities
│       ├── test-utils.tsx   # Custom render functions
│       ├── mocks/           # Mock data and factories
│       │   ├── handlers.ts  # MSW handlers
│       │   ├── server.ts    # MSW server setup
│       │   └── factories.ts # Data factories
│       └── setup.ts         # Global test setup
├── vitest.config.ts         # Already exists
└── vitest.setup.ts          # Global setup file
```

## Testing Layers

### 1. Unit Tests

**Purpose:** Test individual functions, utilities, and hooks in isolation.

**Coverage:**
- [`lib/utils.ts`](lib/utils.ts) - `cn()`, `isValidHttpURL()`
- [`hooks/use-debounce.ts`](hooks/use-debounce.ts) - Debounce logic
- [`hooks/use-all-paginated.ts`](hooks/use-all-paginated.ts) - Pagination fetching
- [`hooks/use-mobile.ts`](hooks/use-mobile.ts) - Mobile detection

**Example Structure:**
```typescript
// lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, isValidHttpURL } from '../utils'

describe('cn()', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})

describe('isValidHttpURL()', () => {
  it('should validate HTTP URLs', () => {
    expect(isValidHttpURL('http://example.com')).toBe(true)
  })
  
  it('should validate HTTPS URLs', () => {
    expect(isValidHttpURL('https://example.com')).toBe(true)
  })
  
  it('should reject invalid URLs', () => {
    expect(isValidHttpURL('not-a-url')).toBe(false)
    expect(isValidHttpURL(null)).toBe(false)
  })
})
```

### 2. Component Tests

**Purpose:** Test React components in isolation with mocked dependencies.

**Coverage:**
- UI components (Button, Input, Dialog, etc.)
- Business components (SearchBar, DataTable, Forms)
- Composite components (FileBrowser, Stepper)

**Key Principles:**
- Test user interactions, not implementation details
- Mock external dependencies (API calls, router, etc.)
- Test accessibility (ARIA attributes, keyboard navigation)
- Test error states and loading states

**Example Structure:**
```typescript
// components/__tests__/search-bar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { userEvent } from '@testing-library/user-event'
import { SearchBar } from '../search-bar'

describe('SearchBar', () => {
  beforeEach(() => {
    // Setup mocks
  })

  it('should render search input', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument()
  })

  it('should debounce search input', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText(/type a command/i)
    await user.type(input, 'test')
    
    // Verify debounce behavior
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'test' })
      )
    }, { timeout: 500 })
  })

  it('should display search results', async () => {
    // Mock API response
    render(<SearchBar />)
    // Test result rendering
  })
})
```

### 3. Integration Tests

**Purpose:** Test complete user workflows across multiple components.

**Coverage:**
- Project creation flow
- Run viewing workflow
- Data ingestion workflow
- Search and navigation

**Example Structure:**
```typescript
// __tests__/workflows/project-creation.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { userEvent } from '@testing-library/user-event'

describe('Project Creation Workflow', () => {
  it('should create a new project end-to-end', async () => {
    const user = userEvent.setup()
    render(<App />, { route: '/projects' })
    
    // Click create button
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    // Fill form
    await user.type(screen.getByLabelText(/project name/i), 'Test Project')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/project created/i)).toBeInTheDocument()
    })
  })
})
```

## Test Utilities

### Custom Render Function

Create a custom render function that wraps components with necessary providers:

```typescript
// test/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

interface CustomRenderOptions extends RenderOptions {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { route = '/', queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }), ...renderOptions } = options || {}

  const router = createRouter({ routeTree })
  router.navigate({ to: route })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>
          {children}
        </RouterProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { renderWithProviders as render }
```

### Mock Data Factories

Create factories for generating test data:

```typescript
// test/mocks/factories.ts
import { faker } from '@faker-js/faker'
import type { ProjectPublic, SequencingRunPublic } from '@/client'

export const createMockProject = (overrides?: Partial<ProjectPublic>): ProjectPublic => ({
  project_id: faker.string.uuid(),
  name: faker.commerce.productName(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  attributes: {},
  ...overrides,
})

export const createMockRun = (overrides?: Partial<SequencingRunPublic>): SequencingRunPublic => ({
  barcode: faker.string.alphanumeric(10),
  experiment_name: faker.commerce.productName(),
  created_at: faker.date.past().toISOString(),
  ...overrides,
})

export const createMockProjects = (count: number): ProjectPublic[] => 
  Array.from({ length: count }, () => createMockProject())
```

### MSW Handlers

Set up Mock Service Worker for API mocking:

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { createMockProjects, createMockProject } from './factories'

export const handlers = [
  // Search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')
    
    return HttpResponse.json({
      projects: { data: createMockProjects(3) },
      runs: { data: [] },
    })
  }),

  // Projects list
  http.get('/api/projects', () => {
    return HttpResponse.json({
      data: createMockProjects(10),
      total_items: 10,
      total_pages: 1,
      current_page: 1,
      per_page: 10,
    })
  }),

  // Create project
  http.post('/api/projects', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      createMockProject(body as Partial<ProjectPublic>),
      { status: 201 }
    )
  }),
]
```

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

## Test Configuration

### Vitest Setup File

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './src/test/mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after all tests
afterAll(() => server.close())
```

### Updated Vitest Config

```javascript
// vite.config.js (update test section)
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/routeTree.gen.ts',
        'src/client/**', // Generated client code
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
```

## Testing Best Practices

### 1. Follow Testing Library Principles

```typescript
// ❌ Bad - Testing implementation details
expect(wrapper.find('.search-input').prop('value')).toBe('test')

// ✅ Good - Testing from user's perspective
expect(screen.getByRole('textbox', { name: /search/i })).toHaveValue('test')
```

### 2. Use User Events Over FireEvent

```typescript
// ❌ Bad
fireEvent.click(button)

// ✅ Good - More realistic user interactions
const user = userEvent.setup()
await user.click(button)
```

### 3. Query Priority

Use queries in this order:
1. `getByRole` (most accessible)
2. `getByLabelText` (forms)
3. `getByPlaceholderText` (inputs)
4. `getByText` (non-interactive)
5. `getByTestId` (last resort)

### 4. Async Testing

```typescript
// Wait for elements to appear
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})

// Use findBy for elements that appear asynchronously
const element = await screen.findByText(/loading/i)
```

### 5. Mock Only What's Necessary

```typescript
// Mock external dependencies, not internal logic
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: mockData }))
}))
```

## Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Overall | 70%+ |
| Utilities | 90%+ |
| Hooks | 85%+ |
| Components | 70%+ |
| Integration | Key workflows covered |

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- search-bar.test.tsx

# Run tests matching pattern
npm test -- --grep="SearchBar"
```

## CI/CD Integration

Tests should run automatically on:
- Pull requests
- Merges to main
- Pre-deployment

Example GitHub Actions workflow:

```yaml
name: Frontend Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-ui/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend-ui
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend-ui
        run: npm run lint
      
      - name: Run tests
        working-directory: ./frontend-ui
        run: npm test
      
      - name: Generate coverage
        working-directory: ./frontend-ui
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend-ui/coverage/lcov.info
```

## Test Maintenance

### Regular Tasks

1. **Update snapshots** when intentional UI changes occur
2. **Review coverage reports** to identify untested code
3. **Refactor tests** when components change significantly
4. **Remove obsolete tests** when features are deprecated
5. **Add regression tests** when bugs are fixed

### Code Review Checklist

- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests are not flaky
- [ ] Tests follow naming conventions
- [ ] Tests use appropriate queries
- [ ] Mock data is realistic
- [ ] Tests are well-documented

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)