# Frontend Testing - Complete Guide

Welcome to the NGS360 frontend testing documentation! This guide will help you implement comprehensive unit testing for your React application.

## 📚 Documentation Structure

We have organized the testing documentation into multiple focused guides:

1. **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - High-level testing philosophy, architecture, and best practices
2. **[TESTING_IMPLEMENTATION_GUIDE.md](TESTING_IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation with complete code examples
3. **[TESTING_QUICK_REFERENCE.md](TESTING_QUICK_REFERENCE.md)** - Quick lookup for common patterns and commands
4. **[.github-workflows-frontend-tests.yml.md](.github-workflows-frontend-tests.yml.md)** - CI/CD configuration

## 🚀 Quick Start

### 1. Install Additional Dependencies

```bash
cd frontend-ui
npm install -D @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 @vitest/ui msw
```

### 2. Create Test Infrastructure

Create these files in your project:

```
frontend-ui/
├── vitest.setup.ts                     # Global test setup
├── src/
│   └── test/
│       ├── test-utils.tsx              # Custom render with providers
│       ├── test-utils-hooks.tsx        # Hook testing utilities
│       └── mocks/
│           ├── factories.ts            # Mock data factories
│           ├── handlers.ts             # MSW API handlers
│           └── server.ts               # MSW server setup
```

Copy the complete code from [`TESTING_IMPLEMENTATION_GUIDE.md`](TESTING_IMPLEMENTATION_GUIDE.md).

### 3. Update Configuration Files

Update [`vite.config.js`](vite.config.js) and [`package.json`](package.json) as shown in the implementation guide.

### 4. Write Your First Test

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn()', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
})
```

### 5. Run Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

## 📋 Implementation Checklist

Use this checklist to track your testing implementation:

### Phase 1: Infrastructure (Week 1)
- [ ] Install additional dependencies
- [ ] Create `vitest.setup.ts`
- [ ] Create `src/test/test-utils.tsx`
- [ ] Create `src/test/test-utils-hooks.tsx`
- [ ] Create `src/test/mocks/factories.ts`
- [ ] Create `src/test/mocks/handlers.ts`
- [ ] Create `src/test/mocks/server.ts`
- [ ] Update `vite.config.js`
- [ ] Update `package.json` scripts
- [ ] Verify setup with a simple test

### Phase 2: Unit Tests (Week 2)
- [ ] Test `lib/utils.ts` functions
- [ ] Test `hooks/use-debounce.ts`
- [ ] Test `hooks/use-all-paginated.ts`
- [ ] Test `hooks/use-mobile.ts`
- [ ] Add tests for any utility functions

### Phase 3: UI Component Tests (Week 3)
- [ ] Test `components/ui/button.tsx`
- [ ] Test `components/ui/input.tsx`
- [ ] Test `components/ui/dialog.tsx`
- [ ] Test `components/ui/select.tsx`
- [ ] Test other UI components as needed

### Phase 4: Business Component Tests (Week 4-5)
- [ ] Test `components/search-bar.tsx`
- [ ] Test `components/data-table/data-table.tsx`
- [ ] Test `components/create-project-form.tsx`
- [ ] Test `components/execute-workflow-form.tsx`
- [ ] Test `components/file-upload.tsx`
- [ ] Test `components/file-browser.tsx`
- [ ] Test other business components

### Phase 5: Integration Tests (Week 6)
- [ ] Project creation workflow
- [ ] Project viewing and editing
- [ ] Run viewing workflow
- [ ] Search and navigation
- [ ] Data ingestion workflow
- [ ] Vendor management workflow

### Phase 6: CI/CD & Polish (Week 7)
- [ ] Set up GitHub Actions workflow
- [ ] Configure coverage thresholds
- [ ] Add pre-commit hooks (optional)
- [ ] Document any custom patterns
- [ ] Team training session

## 📊 Coverage Goals

| Category | Target | Priority |
|----------|--------|----------|
| Utils | 90%+ | High |
| Hooks | 85%+ | High |
| Business Components | 70%+ | High |
| UI Components | 70%+ | Medium |
| Integration Tests | Key workflows | High |

## 🎯 Testing Priorities

Focus your testing efforts in this order:

1. **Critical Path Components** (Priority 1)
   - Search functionality
   - Project creation/editing
   - Data table filtering/sorting
   - Form validation and submission
   - File upload

2. **Business Logic** (Priority 2)
   - Custom hooks
   - Utility functions
   - Data transformations
   - API client functions

3. **UI Components** (Priority 3)
   - Reusable UI components
   - Layout components
   - Navigation components

4. **Edge Cases** (Priority 4)
   - Error handling
   - Loading states
   - Empty states
   - Permission checks

## 🔧 Common Testing Patterns

### Testing a Form Component

```typescript
it('should submit form with valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  
  render(<YourForm onSubmit={onSubmit} />)
  
  await user.type(screen.getByLabelText(/name/i), 'Test Name')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Name'
    })
  })
})
```

### Testing with Mock API

```typescript
it('should load and display data', async () => {
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

### Testing Hooks with TanStack Query

```typescript
it('should fetch data with useQuery hook', async () => {
  const mockData = createMockProjects(1)
  
  server.use(
    http.get('/api/projects/:id', () => {
      return HttpResponse.json(mockData[0])
    })
  )
  
  const { result } = renderHookWithProviders(() => 
    useQuery({
      queryKey: ['project', '123'],
      queryFn: () => fetchProject('123')
    })
  )
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
  
  expect(result.current.data).toEqual(mockData[0])
})
```

## 🐛 Debugging Tests

### Print Current DOM

```typescript
screen.debug()                          // Print entire DOM
screen.debug(screen.getByRole('button')) // Print specific element
```

### Find Elements

```typescript
// Use query instead of get to avoid throwing
const element = screen.queryByText(/text/i)
console.log('Element found:', element !== null)

// Log all available roles
screen.logTestingPlaygroundURL()
```

### Common Issues

**Issue: "Unable to find element"**
- Use `screen.debug()` to see what's rendered
- Check if element appears asynchronously (use `findBy` instead of `getBy`)
- Verify your query matches the actual text/role

**Issue: "Not wrapped in act(...)"**
- Use `await` with user events
- Use `waitFor` for state updates
- Ensure async operations complete

**Issue: "Tests timeout"**
- Increase timeout in `waitFor`
- Check for infinite loops in components
- Verify API mocks are set up correctly

## 📈 Monitoring Test Health

### Run Coverage Reports

```bash
npm run test:coverage
```

View the HTML report at `coverage/index.html`.

### Identify Untested Code

Look for:
- Red or yellow highlighted code in coverage report
- Functions with 0% coverage
- Branches with missing test cases

### Review Test Quality

Ask yourself:
- Do tests verify user behavior or implementation details?
- Are tests independent and isolated?
- Do tests cover error cases?
- Are mocks realistic?

## 🔄 Maintenance

### When to Update Tests

- **Component changes**: Update corresponding tests
- **Bug fixes**: Add regression tests
- **New features**: Write tests alongside code
- **Refactoring**: Ensure tests still pass

### Test Code Review Checklist

- [ ] Tests follow naming conventions
- [ ] Tests use appropriate queries (prefer `getByRole`)
- [ ] Tests verify user-facing behavior
- [ ] Mocks are realistic and minimal
- [ ] Async operations are properly awaited
- [ ] Tests are well-documented
- [ ] Coverage meets thresholds

## 🎓 Learning Resources

### Official Documentation
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

### Recommended Reading
- [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Library Best Practices](https://kentcdodds.com/blog/testing-implementation-details)
- [Effective Snapshot Testing](https://kentcdodds.com/blog/effective-snapshot-testing)

### Video Tutorials
- [Kent C. Dodds - Testing JavaScript](https://testingjavascript.com/)
- [React Testing Library Course](https://testing-library.com/docs/react-testing-library/intro)

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns in the codebase
2. Use the templates in [`TESTING_QUICK_REFERENCE.md`](TESTING_QUICK_REFERENCE.md)
3. Ensure tests are focused and independent
4. Add documentation for complex test scenarios
5. Run `npm run test:coverage` before committing

## 💬 Getting Help

- Check [`TESTING_QUICK_REFERENCE.md`](TESTING_QUICK_REFERENCE.md) for common patterns
- Review existing test files for examples
- Consult the official documentation
- Ask the team in Slack/Teams

## 📝 Next Steps

1. **Start Small**: Begin with utility function tests
2. **Build Confidence**: Move to hook tests once comfortable
3. **Scale Up**: Tackle component tests
4. **Go Big**: Implement integration tests
5. **Automate**: Set up CI/CD pipeline
6. **Maintain**: Keep tests updated and relevant

Good luck with your testing journey! 🎉