# Testing Implementation Guide

This guide provides concrete code examples for implementing the testing strategy outlined in [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md).

## Table of Contents

1. [Setup Files](#setup-files)
2. [Test Utilities](#test-utilities)
3. [Mock Factories](#mock-factories)
4. [MSW Handlers](#msw-handlers)
5. [Example Tests](#example-tests)
6. [Package.json Updates](#packagejson-updates)
7. [Vite Config Updates](#vite-config-updates)

---

## Setup Files

### `vitest.setup.ts`

Create at root of `frontend-ui/`:

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './src/test/mocks/server'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

---

## Test Utilities

### `src/test/test-utils.tsx`

Custom render function with all providers:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import type { ReactElement, ReactNode } from 'react'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  queryClient?: QueryClient
}

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - The component to render
 * @param options - Render options including route and queryClient
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = options || {}

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
  })

  // Navigate to initial route
  if (route !== '/') {
    router.navigate({ to: route }).catch(() => {
      // Ignore navigation errors in tests
    })
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>{children}</RouterProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    router,
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }
export { userEvent } from '@testing-library/user-event'
```

### `src/test/test-utils-hooks.tsx`

Utility for testing hooks:

```typescript
import { renderHook, RenderHookOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

interface CustomRenderHookOptions<TProps> extends RenderHookOptions<TProps> {
  queryClient?: QueryClient
}

/**
 * Custom renderHook wrapper with QueryClient provider
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: CustomRenderHookOptions<TProps>
) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    }),
    ...hookOptions
  } = options || {}

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...hookOptions }),
    queryClient,
  }
}

export * from '@testing-library/react'
```

---

## Mock Factories

### `src/test/mocks/factories.ts`

Data factories using Faker:

```typescript
import { faker } from '@faker-js/faker'
import type {
  ProjectPublic,
  SequencingRunPublic,
  SamplePublic,
  VendorPublic,
  PaginatedResponse,
} from '@/client'

/**
 * Create a mock project with optional overrides
 */
export const createMockProject = (
  overrides?: Partial<ProjectPublic>
): ProjectPublic => ({
  project_id: faker.string.uuid(),
  name: faker.commerce.productName(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  attributes: {
    [faker.word.noun()]: faker.word.adjective(),
  },
  ...overrides,
})

/**
 * Create multiple mock projects
 */
export const createMockProjects = (count: number): ProjectPublic[] =>
  Array.from({ length: count }, () => createMockProject())

/**
 * Create a mock sequencing run with optional overrides
 */
export const createMockRun = (
  overrides?: Partial<SequencingRunPublic>
): SequencingRunPublic => ({
  barcode: faker.string.alphanumeric(10).toUpperCase(),
  experiment_name: faker.commerce.productName(),
  flowcell_id: faker.string.alphanumeric(8),
  instrument_id: faker.string.alphanumeric(6),
  run_date: faker.date.past().toISOString(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

/**
 * Create multiple mock runs
 */
export const createMockRuns = (count: number): SequencingRunPublic[] =>
  Array.from({ length: count }, () => createMockRun())

/**
 * Create a mock sample with optional overrides
 */
export const createMockSample = (
  overrides?: Partial<SamplePublic>
): SamplePublic => ({
  sample_id: faker.string.uuid(),
  sample_name: faker.commerce.productName(),
  barcode: faker.string.alphanumeric(10),
  created_at: faker.date.past().toISOString(),
  ...overrides,
})

/**
 * Create a mock vendor with optional overrides
 */
export const createMockVendor = (
  overrides?: Partial<VendorPublic>
): VendorPublic => ({
  vendor_id: faker.string.uuid(),
  name: faker.company.name(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

/**
 * Create a mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  data: T[],
  options?: {
    page?: number
    per_page?: number
    total_items?: number
  }
): PaginatedResponse<T> => {
  const page = options?.page || 1
  const per_page = options?.per_page || 10
  const total_items = options?.total_items || data.length
  const total_pages = Math.ceil(total_items / per_page)

  return {
    data,
    total_items,
    total_pages,
    current_page: page,
    per_page,
    has_next: page < total_pages,
    has_prev: page > 1,
  }
}
```

---

## MSW Handlers

### `src/test/mocks/handlers.ts`

Mock API handlers:

```typescript
import { http, HttpResponse } from 'msw'
import {
  createMockProjects,
  createMockProject,
  createMockRuns,
  createMockPaginatedResponse,
} from './factories'
import type { ProjectCreate } from '@/client'

const API_BASE = '/api'

export const handlers = [
  // Search endpoint
  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    const n_results = Number(url.searchParams.get('n_results')) || 5

    return HttpResponse.json({
      projects: {
        data: createMockProjects(Math.min(n_results, 3)),
      },
      runs: {
        data: createMockRuns(Math.min(n_results, 3)),
      },
    })
  }),

  // Projects list
  http.get(`${API_BASE}/projects`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const per_page = Number(url.searchParams.get('per_page')) || 10

    const mockData = createMockProjects(per_page)
    return HttpResponse.json(
      createMockPaginatedResponse(mockData, {
        page,
        per_page,
        total_items: 50,
      })
    )
  }),

  // Get single project
  http.get(`${API_BASE}/projects/:project_id`, ({ params }) => {
    return HttpResponse.json(
      createMockProject({ project_id: params.project_id as string })
    )
  }),

  // Create project
  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = (await request.json()) as ProjectCreate
    return HttpResponse.json(
      createMockProject({
        name: body.name,
        attributes: body.attributes,
      }),
      { status: 201 }
    )
  }),

  // Update project
  http.patch(`${API_BASE}/projects/:project_id`, async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json(
      createMockProject({
        project_id: params.project_id as string,
        ...body,
      })
    )
  }),

  // Delete project
  http.delete(`${API_BASE}/projects/:project_id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Runs list
  http.get(`${API_BASE}/runs`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const per_page = Number(url.searchParams.get('per_page')) || 10

    const mockData = createMockRuns(per_page)
    return HttpResponse.json(
      createMockPaginatedResponse(mockData, {
        page,
        per_page,
        total_items: 50,
      })
    )
  }),

  // Get single run
  http.get(`${API_BASE}/runs/:run_barcode`, ({ params }) => {
    return HttpResponse.json(
      createMockRun({ barcode: params.run_barcode as string })
    )
  }),
]
```

### `src/test/mocks/server.ts`

MSW server setup:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup server with default handlers
export const server = setupServer(...handlers)

// Helper to reset handlers in tests
export const resetHandlers = () => server.resetHandlers()

// Helper to add runtime handlers
export const addHandler = (...newHandlers: Parameters<typeof server.use>) =>
  server.use(...newHandlers)
```

---

## Example Tests

### Unit Test: `src/lib/__tests__/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { cn, isValidHttpURL } from '../utils'

describe('utils', () => {
  describe('cn()', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('', null, undefined)).toBe('')
    })
  })

  describe('isValidHttpURL()', () => {
    it('should validate HTTP URLs', () => {
      expect(isValidHttpURL('http://example.com')).toBe(true)
      expect(isValidHttpURL('http://localhost:3000')).toBe(true)
    })

    it('should validate HTTPS URLs', () => {
      expect(isValidHttpURL('https://example.com')).toBe(true)
      expect(isValidHttpURL('https://api.example.com/path')).toBe(true)
    })

    it('should reject invalid protocols', () => {
      expect(isValidHttpURL('ftp://example.com')).toBe(false)
      expect(isValidHttpURL('file:///path/to/file')).toBe(false)
    })

    it('should reject non-URL strings', () => {
      expect(isValidHttpURL('not-a-url')).toBe(false)
      expect(isValidHttpURL('example.com')).toBe(false)
    })

    it('should handle null input', () => {
      expect(isValidHttpURL(null)).toBe(false)
    })

    it('should handle empty string', () => {
      expect(isValidHttpURL('')).toBe(false)
    })
  })
})
```

### Hook Test: `src/hooks/__tests__/use-debounce.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 300 })
    
    // Should still show old value immediately
    expect(result.current).toBe('initial')

    // Should show new value after delay
    await waitFor(
      () => {
        expect(result.current).toBe('updated')
      },
      { timeout: 500 }
    )
  })

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'a', delay: 300 },
      }
    )

    rerender({ value: 'b', delay: 300 })
    rerender({ value: 'c', delay: 300 })
    rerender({ value: 'd', delay: 300 })

    // Should still be 'a' immediately
    expect(result.current).toBe('a')

    // After delay, should jump to 'd' (skipping b and c)
    await waitFor(
      () => {
        expect(result.current).toBe('d')
      },
      { timeout: 500 }
    )
  })

  it('should work with different types', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: 123 },
      }
    )

    expect(result.current).toBe(123)

    rerender({ value: 456 })

    await waitFor(
      () => {
        expect(result.current).toBe(456)
      },
      { timeout: 200 }
    )
  })
})
```

### Hook Test: `src/hooks/__tests__/use-all-paginated.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test/test-utils-hooks'
import { useAllPaginated } from '../use-all-paginated'
import type { PaginatedFetcher } from '../use-all-paginated'

describe('useAllPaginated', () => {
  it('should fetch all pages and return flat array', async () => {
    const mockFetcher: PaginatedFetcher<{ id: number }> = vi.fn(
      async ({ query }) => {
        const page = query.page || 1
        const per_page = query.per_page || 10

        // Simulate 3 pages of data
        if (page > 3) {
          return { data: undefined }
        }

        return {
          data: {
            data: Array.from({ length: per_page }, (_, i) => ({
              id: (page - 1) * per_page + i + 1,
            })),
            total_items: 25,
            total_pages: 3,
            current_page: page,
            per_page,
            has_next: page < 3,
            has_prev: page > 1,
          },
        }
      }
    )

    const { result } = renderHookWithProviders(() =>
      useAllPaginated({
        queryKey: ['test'],
        fetcher: mockFetcher,
        perPage: 10,
      })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetcher).toHaveBeenCalledTimes(3)
    expect(result.current.data).toHaveLength(30)
    expect(result.current.data?.[0]).toEqual({ id: 1 })
    expect(result.current.data?.[29]).toEqual({ id: 30 })
  })

  it('should handle single page response', async () => {
    const mockFetcher: PaginatedFetcher<{ id: number }> = vi.fn(
      async () => ({
        data: {
          data: [{ id: 1 }, { id: 2 }],
          total_items: 2,
          total_pages: 1,
          current_page: 1,
          per_page: 10,
          has_next: false,
          has_prev: false,
        },
      })
    )

    const { result } = renderHookWithProviders(() =>
      useAllPaginated({
        queryKey: ['test'],
        fetcher: mockFetcher,
      })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toHaveLength(2)
  })

  it('should respect enabled option', async () => {
    const mockFetcher = vi.fn()

    const { result } = renderHookWithProviders(() =>
      useAllPaginated({
        queryKey: ['test'],
        fetcher: mockFetcher,
        enabled: false,
      })
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetcher).not.toHaveBeenCalled()
  })
})
```

### Component Test: `src/components/__tests__/search-bar.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/test/test-utils'
import { SearchBar } from '../search-bar'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { createMockProjects, createMockRuns } from '@/test/mocks/factories'

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    render(<SearchBar />)
    expect(
      screen.getByPlaceholderText(/type a command or search/i)
    ).toBeInTheDocument()
  })

  it('should render search icon', () => {
    render(<SearchBar />)
    const searchIcon = document.querySelector('svg[class*="lucide-search"]')
    expect(searchIcon).toBeInTheDocument()
  })

  it('should show results after typing with debounce', async () => {
    const user = userEvent.setup()
    const mockProjects = createMockProjects(3)

    // Mock API response
    server.use(
      http.get('/api/search', () => {
        return HttpResponse.json({
          projects: { data: mockProjects },
          runs: { data: [] },
        })
      })
    )

    render(<SearchBar />)

    const input = screen.getByPlaceholderText(/type a command or search/i)
    await user.type(input, 'test query')

    // Wait for debounce and API call
    await waitFor(
      () => {
        expect(screen.getByText(mockProjects[0].name)).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  it('should display "No results" when search returns empty', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/api/search', () => {
        return HttpResponse.json({
          projects: { data: [] },
          runs: { data: [] },
        })
      })
    )

    render(<SearchBar />)

    const input = screen.getByPlaceholderText(/type a command or search/i)
    await user.type(input, 'nonexistent')

    await waitFor(
      () => {
        const noResultsElements = screen.getAllByText(/no results/i)
        expect(noResultsElements.length).toBeGreaterThan(0)
      },
      { timeout: 500 }
    )
  })

  it('should clear search when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)

    const input = screen.getByPlaceholderText(
      /type a command or search/i
    ) as HTMLInputElement
    await user.type(input, 'test')

    expect(input.value).toBe('test')

    const resetButton = screen.getByTitle(/reset search/i)
    await user.click(resetButton)

    expect(input.value).toBe('')
  })

  it('should navigate to project when clicked', async () => {
    const user = userEvent.setup()
    const mockProject = createMockProjects(1)[0]

    server.use(
      http.get('/api/search', () => {
        return HttpResponse.json({
          projects: { data: [mockProject] },
          runs: { data: [] },
        })
      })
    )

    const { router } = render(<SearchBar />)

    const input = screen.getByPlaceholderText(/type a command or search/i)
    await user.type(input, 'test')

    await waitFor(() => {
      expect(screen.getByText(mockProject.name)).toBeInTheDocument()
    })

    await user.click(screen.getByText(mockProject.name))

    expect(router.state.location.pathname).toContain(mockProject.project_id)
  })
})
```

### Component Test: `src/components/__tests__/create-project-form.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/test/test-utils'
import { CreateProjectForm } from '../create-project-form'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { createMockProject } from '@/test/mocks/factories'

describe('CreateProjectForm', () => {
  const trigger = <button>Create Project</button>

  it('should render trigger button', () => {
    render(<CreateProjectForm trigger={trigger} />)
    expect(screen.getByText(/create project/i)).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateProjectForm trigger={trigger} />)

    await user.click(screen.getByText(/create project/i))

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockProject = createMockProject({ name: 'Test Project' })

    server.use(
      http.post('/api/projects', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json(
          createMockProject(body as any),
          { status: 201 }
        )
      })
    )

    render(<CreateProjectForm trigger={trigger} />)

    await user.click(screen.getByText(/create project/i))

    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'Test Project')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/project created/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup()
    render(<CreateProjectForm trigger={trigger} />)

    await user.click(screen.getByText(/create project/i))

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
  })

  it('should add attribute fields dynamically', async () => {
    const user = userEvent.setup()
    render(<CreateProjectForm trigger={trigger} />)

    await user.click(screen.getByText(/create project/i))

    const addButton = screen.getByRole('button', { name: /add attribute/i })
    await user.click(addButton)

    const keyInputs = screen.getAllByLabelText(/key/i)
    expect(keyInputs).toHaveLength(2)
  })

  it('should remove attribute fields', async () => {
    const user = userEvent.setup()
    render(<CreateProjectForm trigger={trigger} />)

    await user.click(screen.getByText(/create project/i))

    // Add extra field
    const addButton = screen.getByRole('button', { name: /add attribute/i })
    await user.click(addButton)

    // Remove field
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[1])

    const keyInputs = screen.getAllByLabelText(/key/i)
    expect(keyInputs).toHaveLength(1)
  })
})
```

### Integration Test: `src/__tests__/workflows/project-workflow.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/test/test-utils'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { createMockProject, createMockPaginatedResponse } from '@/test/mocks/factories'

describe('Project Workflow', () => {
  it('should complete full project creation workflow', async () => {
    const user = userEvent.setup()
    const newProject = createMockProject({ name: 'New Test Project' })

    // Mock responses
    server.use(
      http.get('/api/projects', () => {
        return HttpResponse.json(
          createMockPaginatedResponse([], { total_items: 0 })
        )
      }),
      http.post('/api/projects', async ({ request }) => {
        return HttpResponse.json(newProject, { status: 201 })
      }),
      http.get(`/api/projects/${newProject.project_id}`, () => {
        return HttpResponse.json(newProject)
      })
    )

    // Start at projects page
    render(<div>App Component</div>, { route: '/projects' })

    // Click create button
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Fill form
    await user.type(screen.getByLabelText(/name/i), newProject.name)
    
    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument()
    })

    // Verify navigation to new project
    await waitFor(() => {
      expect(window.location.pathname).toContain(newProject.project_id)
    })
  })
})
```

---

## Package.json Updates

Add these scripts to [`package.json`](package.json):

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:watch": "vitest --coverage"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/coverage-v8": "^3.0.5",
    "@vitest/ui": "^3.0.5",
    "msw": "^2.7.0"
  }
}
```

---

## Vite Config Updates

Update the test section in [`vite.config.js`](vite.config.js):

```javascript
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

---

## Additional Dependencies to Install

```bash
cd frontend-ui
npm install -D @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 @vitest/ui msw
```

---

## Next Steps

1. Install additional dependencies
2. Create all the test utility files
3. Write tests for each component/hook/utility
4. Run tests and verify coverage
5. Set up CI/CD integration

See [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) for detailed testing guidelines and best practices.