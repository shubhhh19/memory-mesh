# Contributing to Memory Mesh

Thank you for your interest in contributing to Memory Mesh! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/memory-layer.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests to ensure everything works
6. Commit your changes with clear commit messages
7. Push to your fork and submit a pull request

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ with pgvector (or SQLite for local development)
- Redis (optional for local development)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Code Style

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints for all function signatures
- Maximum line length: 100 characters
- Use `ruff` for linting and formatting
- Use `mypy` for type checking

```bash
# Format code
ruff check --select I --fix .

# Lint
ruff check .

# Type check
mypy src
```

### TypeScript (Frontend)
- Follow the existing code style
- Use TypeScript for all new files
- Use ESLint for linting

```bash
npm run lint
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

Examples:
```
feat: Add WebSocket support for real-time updates
fix: Resolve race condition in embedding generation
docs: Update API documentation for search endpoint
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src/ai_memory_layer --cov-report=html

# Run specific test file
pytest tests/unit/test_services.py

# Run specific test
pytest tests/unit/test_services.py::test_message_creation
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Pull Request Process

1. **Update Documentation**: Ensure any new features or changes are documented
2. **Add Tests**: Include tests for new functionality
3. **Update Changelog**: Add an entry to CHANGELOG.md (if it exists)
4. **Pass CI Checks**: Ensure all CI checks pass
5. **Request Review**: Request review from maintainers
6. **Address Feedback**: Make requested changes promptly

## Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No new warnings generated
- [ ] Dependent changes merged and published

## Areas for Contribution

### High Priority
- Performance optimizations
- Additional embedding providers
- Enhanced analytics features
- Improved error handling
- Documentation improvements

### Good First Issues
- Adding tests
- Fixing typos
- Improving error messages
- Adding code comments
- Documentation updates

## Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Python version, Node version, etc.
6. **Logs**: Relevant error messages or logs
7. **Screenshots**: If applicable

## Feature Requests

When requesting features, please include:

1. **Use Case**: Why this feature would be useful
2. **Proposed Solution**: How you envision it working
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## Code Review Process

- Maintainers will review PRs within 1-2 weeks
- Feedback will be provided as comments on the PR
- Once approved, a maintainer will merge the PR
- PRs may be closed if inactive for 30+ days

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others when possible
- Follow the code of conduct

## Questions?

If you have questions, please:
- Check existing issues and discussions
- Open a new discussion on GitHub
- Reach out to maintainers

Thank you for contributing to Memory Mesh! 🎉
