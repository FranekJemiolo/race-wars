# Behavioral Tests

This directory contains behavioral tests that verify critical system scenarios and ensure the Race Wars system works correctly under various conditions.

## Test Categories

### 1. Authentication Behavioral Tests
- **File**: `auth.behavioral.spec.ts`
- **Purpose**: Tests critical authentication scenarios including registration, login, token management, and security behaviors
- **Scenarios Covered**:
  - Concurrent registration handling
  - Email format validation
  - Password strength enforcement
  - Rate limiting on failed attempts
  - Token expiration and refresh
  - Role-based access control

### 2. Track Management Behavioral Tests
- **File**: `track.behavioral.spec.ts`
- **Purpose**: Tests track creation, validation, and spatial operations
- **Scenarios Covered**:
  - Track geometry validation
  - Concurrent track operations
  - GPS point projection
  - Spatial queries and searches
  - Track updates and modifications

### 3. System Behavioral Tests
- **File**: `system.behavioral.spec.ts`
- **Purpose**: High-level system behavior verification
- **Scenarios Covered**:
  - Database connectivity
  - Authentication flows
  - Spatial data processing
  - Race control operations
  - Enforcement system behavior
  - Concurrent operations
  - Error recovery
  - Performance under load
  - Data integrity
  - Security measures
  - Real-time features
  - API behavior

## Running Tests

### Behavioral Tests Only
```bash
npm run test:behavioral
```

### Behavioral Tests with Coverage
```bash
npm run test:behavioral:coverage
```

### Behavioral Tests in Watch Mode
```bash
npm run test:behavioral:watch
```

### All Tests
```bash
npm run test:all
```

## Test Structure

Each behavioral test file follows this structure:

1. **Setup and Teardown**: Create test data and cleanup after tests
2. **Scenario Groups**: Tests organized by functionality
3. **Critical Scenarios**: Tests that verify core system behaviors
4. **Edge Cases**: Tests for unusual conditions and error handling
5. **Performance Tests**: Tests for system performance under load
6. **Concurrent Operations**: Tests for race conditions and simultaneous operations

## Key Scenarios Tested

### Authentication Scenarios
- ✅ User registration with validation
- ✅ Login with correct/incorrect credentials
- ✅ Token refresh and expiration
- ✅ Concurrent registration attempts
- ✅ Rate limiting behavior
- ✅ Role-based permissions

### Track Management Scenarios
- ✅ Track creation with geometry validation
- ✅ Spatial operations and queries
- ✅ GPS point projection
- ✅ Track search and filtering
- ✅ Concurrent track operations

### System Scenarios
- ✅ Database connection handling
- ✅ Error recovery mechanisms
- ✅ Performance under load
- ✅ Data integrity maintenance
- ✅ Security measures
- ✅ Concurrent operations

## Test Environment

Tests run in a controlled environment with:
- Isolated test database
- Mocked external dependencies
- Increased timeouts for behavioral tests (30 seconds)
- Console output suppression for cleaner test runs

## Coverage Goals

Behavioral tests aim to cover:
- **Critical Paths**: 90%+ coverage of core workflows
- **Error Scenarios**: 85%+ coverage of error handling
- **Edge Cases**: 80%+ coverage of unusual conditions
- **Performance**: Validation of performance requirements

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Realistic Data**: Use realistic test data that mirrors production
4. **Error Verification**: Test both success and failure scenarios
5. **Performance Testing**: Include performance assertions where relevant
6. **Concurrent Testing**: Test race conditions and simultaneous operations

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure test database is running
2. **Environment Variables**: Check test environment configuration
3. **Timeouts**: Increase timeout for slow operations
4. **Test Data**: Verify test data cleanup between runs

### Debugging
- Use `test:behavioral:debug` for detailed output
- Check test logs for specific error messages
- Verify database state after failed tests
- Use individual test files for focused debugging

## Integration with CI/CD

These behavioral tests are designed to run in CI/CD pipelines:
- Fast execution for quick feedback
- Comprehensive coverage for confidence
- Isolated environment for reliability
- Clear reporting for issue identification
