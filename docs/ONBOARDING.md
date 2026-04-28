# Race Wars Developer Onboarding Guide

Welcome to the Race Wars development team! This guide will help you get up to speed with the project quickly.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Key Technologies](#key-technologies)
- [Development Workflow](#development-workflow)
- [First Week Checklist](#first-week-checklist)
- [Resources](#resources)
- [Getting Help](#getting-help)

## Project Overview

Race Wars is a real-time GPS-based racing platform that enables drivers to participate in tracked racing sessions using their smartphones. The system consists of:

- **Admin Console**: Web-based interface for race organizers (React/TypeScript)
- **Backend API**: RESTful API and WebSocket server (Node.js/TypeScript)
- **Driver App**: Mobile app for GPS tracking (React Native - planned)
- **Infrastructure**: Kubernetes-based deployment on AWS

### Core Features

- Real-time GPS position tracking
- Automatic incident detection (off-track, collision, spin, stall)
- Penalty management system
- Session recording and replay
- Live leaderboard
- Analytics dashboard
- Multi-camera spectator view

## Development Environment Setup

### Prerequisites

- **Node.js**: 18+ (use nvm for version management)
- **npm**: 9+ (comes with Node.js)
- **Git**: Latest version
- **Docker**: 20+ (for local services)
- **PostgreSQL**: 15+ (or use Docker)
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- GitLens
- Docker
- PostgreSQL

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/FranekJemiolo/race-wars.git
   cd race-wars
   ```

2. **Install Node.js using nvm**
   ```bash
   nvm install 18
   nvm use 18
   ```

3. **Install dependencies**
   ```bash
   # Server dependencies
   cd server
   npm install

   # Client dependencies
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start local services with Docker**
   ```bash
   cd ../
   docker-compose up -d postgres redis nats
   ```

6. **Run database migrations**
   ```bash
   cd server
   npm run db:migrate
   ```

7. **Start development servers**
   ```bash
   # Terminal 1: Server
   cd server
   npm run dev

   # Terminal 2: Client
   cd client
   npm run dev
   ```

8. **Verify setup**
   - Open http://localhost:3000 for the admin console
   - Check server logs at http://localhost:8080/health
   - Verify database connection in server logs

## Project Structure

```
race-wars/
├── client/                 # React admin console
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API clients
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── database/      # Database setup
│   │   │   ├── migrations/ # SQL migrations
│   │   │   └── repositories/ # Data access
│   │   ├── middleware/    # Express middleware
│   │   ├── network/       # WebSocket server
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/        # Infrastructure as code
│   ├── k8s/              # Kubernetes manifests
│   ├── terraform/        # Terraform configuration
│   └── docker/           # Docker configurations
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── ADMIN_GUIDE.md
│   ├── DRIVER_GUIDE.md
│   └── ONBOARDING.md
└── shared/               # Shared types (if using monorepo)
```

## Key Technologies

### Frontend (Admin Console)

- **React 18**: UI framework
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **shadcn/ui**: Component library
- **React Query**: Data fetching
- **Mapbox GL JS**: Maps
- **Vite**: Build tool

### Backend

- **Node.js 18**: Runtime
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **PostgreSQL**: Database
- **Redis**: Caching
- **NATS**: Message queue
- **WebSocket (ws)**: Real-time communication

### Infrastructure

- **Kubernetes**: Container orchestration
- **Docker**: Containerization
- **Terraform**: Infrastructure as code
- **AWS**: Cloud provider
- **GitHub Actions**: CI/CD

### Monitoring & Observability

- **Prometheus**: Metrics
- **Grafana**: Metrics visualization
- **OpenTelemetry**: Distributed tracing
- **Jaeger**: Trace visualization
- **Sentry**: Error tracking
- **ELK Stack**: Log aggregation

## Development Workflow

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Commit Message Format

Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring

Example:
```
feat: add OAuth integration with Google
```

### Code Review Process

1. Create pull request with clear description
2. Request review from team members
3. Address review comments
4. Update PR based on feedback
5. Merge after approval

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Type check
npm run type-check
```

## First Week Checklist

### Day 1: Setup and Orientation

- [ ] Complete development environment setup
- [ ] Read project documentation (ARCHITECTURE.md)
- [ ] Explore the codebase structure
- [ ] Set up your IDE with recommended extensions
- [ ] Join team communication channels

### Day 2: Understanding the Codebase

- [ ] Read the admin console documentation (ADMIN_GUIDE.md)
- [ ] Explore the React components in `client/src/components/`
- [ ] Review the API routes in `server/src/routes/`
- [ ] Understand the database schema in migrations
- [ ] Run the application locally

### Day 3: Backend Deep Dive

- [ ] Review the service layer in `server/src/services/`
- [ ] Understand the repository pattern
- [ ] Review the WebSocket implementation
- [ ] Explore the database repositories
- [ ] Read the incident detection service

### Day 4: Frontend Deep Dive

- [ ] Review the React components
- [ ] Understand the state management approach
- [ ] Explore the API client services
- [ ] Review the Mapbox integration
- [ ] Understand the real-time updates

### Day 5: Infrastructure and Deployment

- [ ] Review Kubernetes manifests in `infrastructure/k8s/`
- [ ] Understand the Terraform configuration
- [ ] Review the CI/CD pipeline
- [ ] Understand the monitoring setup
- [ ] Review the disaster recovery plan

## Common Tasks

### Adding a New API Endpoint

1. Create the repository method in `server/src/database/repositories/`
2. Create the service method in `server/src/services/`
3. Create the controller in `server/src/controllers/`
4. Add the route in `server/src/routes/`
5. Register the route in `server/src/index.ts`
6. Add tests for the new endpoint

### Adding a New React Component

1. Create component file in `client/src/components/`
2. Use TypeScript interfaces for props
3. Follow existing component patterns
4. Add TailwindCSS classes for styling
5. Export the component
6. Add to parent component or page

### Creating a Database Migration

1. Create new migration file in `server/src/database/migrations/`
2. Name it with sequential number: `022_description.sql`
3. Write SQL for schema changes
4. Test migration locally
5. Commit migration file

### Adding a New Service

1. Create service file in `server/src/services/`
2. Implement class with singleton pattern
3. Add initialization method
4. Add configuration interface
5. Export singleton getter function
6. Add to package.json if new dependencies needed

## Resources

### Documentation

- **Architecture**: docs/ARCHITECTURE.md
- **Admin Guide**: docs/ADMIN_GUIDE.md
- **Driver Guide**: docs/DRIVER_GUIDE.md
- **Contributing**: CONTRIBUTING.md
- **Disaster Recovery**: infrastructure/DISASTER_RECOVERY.md

### External Resources

- **React Documentation**: react.dev
- **TypeScript Documentation**: typescriptlang.org/docs
- **Express Documentation**: expressjs.com
- **PostgreSQL Documentation**: postgresql.org/docs
- **Kubernetes Documentation**: kubernetes.io/docs
- **Terraform Documentation**: developer.hashicorp.com/terraform

### Team Resources

- **Slack**: race-wars.slack.com
- **GitHub**: github.com/FranekJemiolo/race-wars
- **Confluence**: race-wars.atlassian.net (internal)
- **Jira**: race-wars.atlassian.net (internal)

## Best Practices

### Code Quality

- Write TypeScript for all new code
- Follow ESLint rules
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use meaningful variable names

### Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow OWASP security guidelines
- Validate all user inputs
- Use parameterized queries for database

### Performance

- Use caching for frequently accessed data
- Optimize database queries with indexes
- Implement pagination for large datasets
- Use WebSocket for real-time updates
- Monitor performance metrics

### Testing

- Write unit tests for business logic
- Add integration tests for API endpoints
- Test error cases and edge cases
- Aim for >80% code coverage
- Mock external dependencies

## Getting Help

### Internal Resources

- **Tech Lead**: [Name] - [Email]
- **Senior Developers**: [Names]
- **Product Manager**: [Name] - [Email]

### External Resources

- **Stack Overflow**: Tag questions with `race-wars`
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check docs/ folder first

### Asking Questions

When asking for help:
1. Search existing documentation and issues first
2. Provide context about what you're trying to do
3. Share relevant code snippets
4. Explain what you've already tried
5. Include error messages or logs

## Next Steps

After completing the onboarding:

1. **Pick a small task** from the project board
2. **Create a feature branch** for your work
3. **Ask for a code review** before merging
4. **Participate in code reviews** for others
5. **Contribute to documentation**
6. **Attend team standups** (if applicable)

## Feedback

We continuously improve our onboarding process. Please provide feedback on:
- What was unclear?
- What was missing?
- What could be better?
- How long did it take you to get up to speed?

Share your feedback with the tech lead or in the #onboarding Slack channel.

---

**Welcome to the team! We're excited to have you aboard.**

**Version**: 1.0  
**Last Updated**: January 28, 2024
