# Contributing to AI Recoverify Arts

Thank you for your interest in contributing to AI Recoverify Arts! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/ai-recoverify-arts.git
   cd ai-recoverify-arts
   ```
3. **Set up development environment** following [INSTALLATION.md](docs/INSTALLATION.md)
4. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Reporting Bugs

If you find a bug:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - System information (OS, Python/Node version)
   - Screenshots if applicable

### Suggesting Enhancements

For feature requests:

1. **Check existing issues** and discussions
2. **Create a new issue** describing:
   - The problem your feature would solve
   - How you envision the feature working
   - Any alternatives you've considered

### Pull Requests

1. **Create an issue first** for significant changes
2. **Keep changes focused** - one feature/fix per PR
3. **Write clear commit messages**
4. **Update documentation** if needed
5. **Add tests** for new functionality
6. **Ensure all tests pass**

## Development Guidelines

### Python Code Style

Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/):

```python
# Good
def restore_image(image_path, enhancement_level='medium'):
    """Restore a damaged image.

    Args:
        image_path: Path to the input image
        enhancement_level: Level of enhancement (low, medium, high)

    Returns:
        Restored image as numpy array
    """
    pass

# Bad
def restoreImage(imagePath,enhancementLevel='medium'):
    pass
```

**Key Points:**
- Use 4 spaces for indentation
- Maximum line length: 79 characters for code, 72 for docstrings
- Use snake_case for functions and variables
- Use PascalCase for classes
- Include docstrings for all public functions/classes

### JavaScript/React Code Style

Follow standard JavaScript conventions:

```javascript
// Good
function RestoreButton({ onClick, isProcessing }) {
  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className="restore-button"
    >
      {isProcessing ? 'Processing...' : 'Restore'}
    </button>
  );
}

// Bad
function restorebutton(props) {
  return <button onClick={props.onClick}>{props.isProcessing?'Processing...':'Restore'}</button>
}
```

**Key Points:**
- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for components
- Use meaningful variable names
- Keep components small and focused

### Git Commit Messages

Write clear, descriptive commit messages:

```
Good commit message format:

Add feature: Brief description (max 50 chars)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
- Reference issues: "Fixes #123"
```

**Examples:**

✅ Good:
```
Add damage repair algorithm

Implement inpainting-based damage repair that automatically
detects and fixes scratches and tears in artwork.

Fixes #42
```

❌ Bad:
```
fixed stuff
```

## Testing

### Backend Tests

Run Python tests:

```bash
cd backend
python -m pytest tests/ -v
```

Write tests for new features:

```python
import unittest

class TestNewFeature(unittest.TestCase):
    def test_feature_works(self):
        result = new_feature()
        self.assertEqual(result, expected_value)
```

### Frontend Tests

Run React tests:

```bash
cd frontend
npm test
```

Write component tests:

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Test Coverage

Aim for:
- Backend: 80%+ coverage
- Frontend: 70%+ coverage

Check coverage:

```bash
# Backend
pytest --cov=app tests/

# Frontend
npm test -- --coverage
```

## Submitting Changes

### Before Submitting

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all tests**:
   ```bash
   # Backend
   cd backend && python -m pytest tests/

   # Frontend
   cd frontend && npm test
   ```

3. **Check code style**:
   ```bash
   # Python
   flake8 backend/app

   # JavaScript
   npm run lint
   ```

4. **Update documentation** if you:
   - Added new features
   - Changed API endpoints
   - Modified configuration options

### Creating a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub** with:
   - Clear title describing the change
   - Description explaining what and why
   - Link to related issues
   - Screenshots for UI changes

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Updated documentation

   ## Related Issues
   Fixes #(issue number)

   ## Screenshots
   (if applicable)
   ```

### Review Process

1. **Automated checks** must pass:
   - Tests
   - Linting
   - Code coverage

2. **Code review** by maintainers:
   - At least one approval required
   - Address all comments

3. **Merge**:
   - Squash and merge for single commits
   - Merge commit for multiple logical commits

## Development Environment

### Recommended Tools

**Python:**
- IDE: PyCharm, VS Code with Python extension
- Linter: flake8, pylint
- Formatter: black

**JavaScript:**
- IDE: VS Code with ESLint extension
- Linter: ESLint
- Formatter: Prettier

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "python.formatting.provider": "black",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Areas for Contribution

### Good First Issues

Look for issues labeled `good-first-issue`:
- Documentation improvements
- Code cleanup
- Simple bug fixes
- Adding examples

### High Priority

- Performance improvements
- Mobile responsiveness
- Additional image formats
- Batch processing
- API rate limiting

### Advanced

- Deep learning model integration
- Real-time processing
- Cloud deployment
- Advanced restoration algorithms

## Questions?

- **General questions**: Open a [Discussion](https://github.com/yourusername/ai-recoverify-arts/discussions)
- **Bug reports**: Open an [Issue](https://github.com/yourusername/ai-recoverify-arts/issues)
- **Security issues**: Email security@recoverifyarts.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Acknowledged in documentation

Thank you for contributing to AI Recoverify Arts!
