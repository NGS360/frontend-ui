# Testing Quick Reference

Quick commands and patterns for writing tests in the NGS360 frontend.

## Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# With coverage
npm run test:coverage

# Run specific test file
npm test -- search-bar.test.tsx

# Run tests matching pattern
npm test -- --grep="SearchBar"

# Update snapshots
npm test -- -u
```

## Test File Templates

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { functionToTest } from '../module'

describe('functionToTest()', () => {
  it('should handle the happy path', () => {
    const result = functionToTest('input')
    expect(result).toBe('expected')
  })

  it('should handle edge cases', () => {
    expect(functionToTest('')).toBe('')
    expect(functionToTest(null)).toBeUndefined()
  })
})
```

### Hook Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useYourHook } from '../use-your-hook'

describe('useYourHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useYourHook())
    expect(result.current).toBe('initial')
  })

  it('should update state', async () => {
    const { result } = renderHook(() => useYourHook())
    
    act(() => {
      result.current.updateFunction('new value')
    })

    await waitFor(() => {
      expect(result.current.value).toBe('new value')
    })
  })
})
```

### Component Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, userEvent } from '@/test/test-utils'
import { YourComponent } from '../your-component'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText(/expected text/i)).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)
    
    await user.click(screen.getByRole('button'))
    
    expect(screen.getByText(/result/i)).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    render(<YourComponent isLoading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

## Common Query Methods

```typescript
// Accessible queries (preferred)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/search/i)

// Text queries
screen.getByText(/hello world/i)
screen.getByDisplayValue('current value')

// Test ID (last resort)
screen.getByTestId('custom-element')

// Async queries (for elements that appear later)
await screen.findByText(/loaded/i)
await screen.findByRole('button')

// Query variants
getBy... // Throws if not found
queryBy... // Returns null if not found
findBy... // Async, waits for element
```

## Common Assertions

```typescript
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// Value
expect(input).toHaveValue('text')
expect(checkbox).toBeChecked()

// Text content
expect(element).toHaveTextContent('content')
expect(element).toHaveTextContent(/pattern/i)

// Attributes
expect(element).toHaveAttribute('href', '/path')
expect(element).toHaveClass('active')
expect(element).toBeDisabled()
expect(element).toBeEnabled()

// Form
expect(input).toBeRequired()
expect(input).toBeValid()
expect(input).toBeInvalid()
```

## User Interactions

```typescript
const user = userEvent.setup()

// Click
await user.click(button)
await user.dblClick(button)

// Type
await user.type(input, 'text to type')
await user.clear(input)

// Keyboard
await user.keyboard('{Enter}')
await user.keyboard('{Control>}a{/Control}')

// Select
await user.selectOptions(select, 'option1')

// Upload
await user.upload(fileInput, file)

// Hover
await user.hover(element)
await user.unhover(element)
```

## Mocking APIs

```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Override handler for specific test
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json({ data: 'mock data' })
  })
)

// Simulate error
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  })
)

// Simulate network error
server.use(
  http.get('/api/endpoint', () => {
    return HttpResponse.error()
  })
)
```

## Async Testing

```typescript
// Wait for element to appear
await screen.findByText(/loaded/i)

// Wait for assertion
await waitFor(() => {
  expect(screen.getByText(/result/i)).toBeInTheDocument()
})

// Wait with custom timeout
await waitFor(
  () => {
    expect(mockFn).toHaveBeenCalled()
  },
  { timeout: 3000 }
)

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.getByText(/loading/i))
```

## Mocking Functions

```typescript
import { vi } from 'vitest'

// Create mock
const mockFn = vi.fn()

// Mock with return value
const mockFn = vi.fn().mockReturnValue('value')

// Mock with resolved promise
const mockFn = vi.fn().mockResolvedValue('value')

// Mock with rejected promise
const mockFn = vi.fn().mockRejectedValue(new Error('error'))

// Assertions
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('arg')
```

## Testing Forms

```typescript
import { render, screen, userEvent } from '@/test/test-utils'

const user = userEvent.setup()

// Fill form
await user.type(screen.getByLabelText(/name/i), 'John Doe')
await user.type(screen.getByLabelText(/email/i), 'john@example.com')

// Check checkbox
await user.click(screen.getByRole('checkbox', { name: /agree/i }))

// Select option
await user.selectOptions(
  screen.getByLabelText(/country/i),
  'USA'
)

// Submit
await user.click(screen.getByRole('button', { name: /submit/i }))

// Assert validation
expect(screen.getByText(/required/i)).toBeInTheDocument()
```

## Testing Router Navigation

```typescript
const { router } = render(<Component />, { route: '/initial' })

// Trigger navigation
await user.click(screen.getByRole('link', { name: /projects/i }))

// Assert current route
expect(router.state.location.pathname).toBe('/projects')

// Assert route params
expect(router.state.location.pathname).toContain(projectId)
```

## Testing React Query

```typescript
import { QueryClient } from '@tanstack/react-query'

// Create test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Render with custom query client
const { queryClient } = render(<Component />, { queryClient })

// Wait for query to succeed
await waitFor(() => {
  expect(screen.getByText(/data loaded/i)).toBeInTheDocument()
})

// Check loading state
expect(screen.getByText(/loading/i)).toBeInTheDocument()
```

## Common Patterns

### Test Loading State

```typescript
it('should show loading state', () => {
  render(<Component isLoading />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

### Test Error State

```typescript
it('should show error message', () => {
  render(<Component error="Something went wrong" />)
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

### Test Conditional Rendering

```typescript
it('should show content when condition is true', () => {
  const { rerender } = render(<Component show={false} />)
  expect(screen.queryByText(/content/i)).not.toBeInTheDocument()
  
  rerender(<Component show={true} />)
  expect(screen.getByText(/content/i)).toBeInTheDocument()
})
```

### Test API Call

```typescript
it('should fetch data on mount', async () => {
  const mockData = createMockProjects(3)
  
  server.use(
    http.get('/api/projects', () => {
      return HttpResponse.json({ data: mockData })
    })
  )
  
  render(<ProjectsList />)
  
  await waitFor(() => {
    expect(screen.getByText(mockData[0].name)).toBeInTheDocument()
  })
})
```

### Test Debounced Input

```typescript
it('should debounce search input', async () => {
  const user = userEvent.setup()
  render(<SearchBar />)
  
  const input = screen.getByRole('textbox')
  await user.type(input, 'search term')
  
  // Should not call API immediately
  expect(mockFetch).not.toHaveBeenCalled()
  
  // Should call after debounce delay
  await waitFor(
    () => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'search term' })
      )
    },
    { timeout: 500 }
  )
})
```

## Tips

### Use act() for State Updates

```typescript
import { act } from '@testing-library/react'

act(() => {
  // Code that causes state updates
})
```

### Debug Rendered Output

```typescript
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### Find Why Element Not Found

```typescript
// Use query instead of get (doesn't throw)
const element = screen.queryByText(/text/i)
console.log('Found:', element)

// Print all available roles
screen.logTestingPlaygroundURL()
```

### Test Accessibility

```typescript
// Check ARIA attributes
expect(button).toHaveAttribute('aria-label', 'Close')

// Check roles
expect(screen.getByRole('button')).toBeInTheDocument()

// Check keyboard navigation
await user.keyboard('{Tab}')
expect(screen.getByRole('button')).toHaveFocus()
```

## Resources

- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Testing Library Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest API](https://vitest.dev/api/)
- [MSW Recipes](https://mswjs.io/docs/recipes)