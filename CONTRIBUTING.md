# Contributing to Race Wars

Thank you for your interest in contributing to Race Wars! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We ask that you:

- Be respectful and considerate
- Use inclusive language
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or derogatory language
- Personal attacks or insults
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Docker (for local development)
- PostgreSQL 15+ (or use Docker)

### Setting Up Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/FranekJemiolo/race-wars.git
   cd race-wars
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cd server
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Set up the database**
   ```bash
   # Using Docker
   docker-compose up -d postgres redis nats

   # Or use local PostgreSQL
   # Create database and run migrations
   npm run db:migrate
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start server
   cd server
   npm run dev

   # Terminal 2: Start client
   cd client
   npm run dev
   ```

## Development Workflow

### Branching Strategy

We use a simplified Git flow:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Urgent production fixes

### Creating a Feature Branch

1. Ensure your `main` branch is up to date
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a new feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Convention

We follow the Conventional Commits specification:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

Examples:
```
feat: add OAuth integration with Google
fix: resolve GPS tracking accuracy issue
docs: update API documentation
test: add unit tests for incident detection
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions

Example:
```typescript
/**
 * Calculates the distance between two GPS coordinates
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Follow the component naming convention (PascalCase)
- Use TypeScript interfaces for props
- Keep components focused and reusable
- Use TailwindCSS for styling

Example:
```typescript
interface Props {
  sessionId: string;
  onJoin: (id: string) => void;
}

export function SessionCard({ sessionId, onJoin }: Props) {
  return (
    <div className="p-4 border rounded-lg">
      {/* Component content */}
    </div>
  );
}
```

### Database

- Use SQL migrations for schema changes
- Follow naming conventions (snake_case for tables/columns)
- Add indexes for frequently queried columns
- Use transactions for multi-step operations
- Document complex queries with comments

Example migration:
```sql
-- Add user preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

## Testing

### Unit Tests

- Write unit tests for all new functions
- Use Jest for testing
- Aim for >80% code coverage
- Mock external dependencies

Example:
```typescript
describe('calculateDistance', () => {
  it('should return correct distance between two points', () => {
    const distance = calculateDistance(0, 0, 1, 1);
    expect(distance).toBeCloseTo(157249, 0);
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Test WebSocket connections
- Use test database

### E2E Tests

- Test critical user flows
- Use Playwright for browser testing
- Test mobile app interactions (when implemented)

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test.spec.ts
```

## Documentation

### Code Documentation

- Add JSDoc comments to public functions
- Document complex algorithms
- Explain non-obvious logic
- Keep documentation up to date

### API Documentation

- Document all REST endpoints
- Include request/response examples
- Document WebSocket message formats
- Update Swagger/OpenAPI specs

### User Documentation

- Update user guides for new features
- Add screenshots for UI changes
- Update admin documentation
- Keep driver guide current

## Pull Request Process

### Before Submitting

1. **Update documentation**
   - Update relevant documentation
   - Add comments to complex code
   - Update README if needed

2. **Run tests**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Format code**
   ```bash
   npm run format
   ```

### Submitting a PR

1. Push your branch
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub
   - Use a clear title
   - Describe your changes
   - Link related issues
   - Add screenshots for UI changes

3. PR Template
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing performed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review performed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

### Review Process

- At least one maintainer approval required
- Address all review comments
- Update PR based on feedback
- Re-request review after changes

### Merging

- Squash commits for clean history
- Delete feature branch after merge
- Update related issues

## Reporting Issues

### Bug Reports

When reporting a bug, include:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, browser, version)
- Screenshots if applicable
- Error messages or logs

### Feature Requests

When requesting a feature, include:

- Clear description of the feature
- Use case or problem it solves
- Proposed implementation (if known)
- Alternatives considered
- Additional context

### Security Issues

For security vulnerabilities:
- Do not open a public issue
- Email security@racewars.com
- Include details and reproduction steps
- Allow time for response before disclosure

## Getting Help

### Resources

- **Documentation**: docs.racewars.com
- **API Docs**: api.racewars.com/docs
- **Community**: community.racewars.com
- **Discord**: discord.gg/racewars

### Contact

- **General Questions**: hello@racewars.com
- **Support**: support@racewars.com
- **Security**: security@racewars.com

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website (with permission)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Race Wars!
