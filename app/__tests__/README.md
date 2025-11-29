# Test Suite Documentation

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run in watch mode
npm test:watch

# Run specific test file
npm test -- app/services/mocks/__tests__/mock-ai.test.ts

# Run tests for specific pattern
npm test -- --testPathPattern=adapter
```

## Test Structure

```
app/
├── services/__tests__/      # Service layer tests
│   └── performance.test.ts  # Performance benchmarks
├── services/mocks/__tests__/ # Mock service tests
│   ├── mock-ai.test.ts
│   ├── mock-theme.test.ts
│   └── mock-store.test.ts
└── services/adapters/__tests__/ # Adapter pattern tests
    ├── ai-adapter.test.ts
    └── theme-adapter.test.ts
```

## Current Coverage

- **Total Test Suites**: 6
- **Total Tests**: 41
- **Status**: All passing

### Test Distribution

- Mock Services: 22 tests
  - mock-store: 7 tests
  - mock-ai: 7 tests
  - mock-theme: 8 tests
- Adapters: 12 tests
  - ai-adapter: 3 tests
  - theme-adapter: 5 tests
- Performance: 7 tests

## Coverage Goals

- Overall: 70%+ (configured threshold)
- Services: 90%+
- Adapters: 100%
- Mock implementations: 100%

## Writing Tests

### Unit Tests

Test single functions/methods in isolation:

```typescript
describe('MockStore', () => {
  beforeEach(() => {
    mockStore.reset(); // Reset state before each test
  });

  it('saves section metadata', () => {
    const metadata = mockStore.saveSection('theme1', 'test.liquid', 'content');
    expect(metadata.filename).toBe('test.liquid');
  });
});
```

### Mock Configuration

Tests use mock mode by default (configured in `jest.setup.cjs`):

```typescript
// Mock the config
jest.mock('../../config.server', () => ({
  serviceConfig: {
    aiMode: 'mock',
    themeMode: 'mock',
    enableLogging: false,
    simulateLatency: false,
  },
  logServiceConfig: jest.fn(),
}));
```

### Performance Tests

Performance tests measure execution time without latency simulation:

```typescript
it('generates section in < 100ms (without latency)', async () => {
  const start = Date.now();
  await mockAIService.generateSection('test');
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(100);
});
```

## Test Environment

- **Framework**: Jest v30.2.0
- **Environment**: jsdom (for DOM simulation)
- **TypeScript**: ts-jest for TS support
- **Testing Library**: @testing-library/react v16.3.0

### Polyfills

The test environment includes:
- `TextEncoder`/`TextDecoder` for Node compatibility
- `whatwg-fetch` for fetch API support
- Suppressed console output (log/warn)

## CI/CD Integration

Tests run automatically in CI via GitHub Actions:

```yaml
- name: Run unit tests
  run: npm test -- --coverage
```

Coverage reports are uploaded to Codecov for tracking.

## Best Practices

1. **Reset State**: Always reset mock store before each test
2. **Isolation**: Mock external dependencies (config, services)
3. **Fast Execution**: Disable latency simulation in tests
4. **Descriptive Names**: Use clear, descriptive test names
5. **Arrange-Act-Assert**: Follow AAA pattern
6. **No Side Effects**: Tests should not affect each other

## Troubleshooting

### Tests Timing Out

If tests timeout, check for:
- Missing `await` on async operations
- Infinite loops in code
- Network requests (should be mocked)

### Module Not Found Errors

Check:
- Path aliases in `jest.config.cjs` match `tsconfig.json`
- All imports use correct paths
- Mock declarations come before imports

### Type Errors

Run type checking separately:
```bash
npm run typecheck
```

Jest uses `ts-jest` with relaxed TypeScript config for tests.

## Future Enhancements

- [ ] Add component tests for UI components
- [ ] Add E2E tests with Playwright
- [ ] Add integration tests for route loaders/actions
- [ ] Implement mutation testing
- [ ] Add snapshot testing for generated code
