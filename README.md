# Kuiper Partner Onboarding Hub

An internal platform for Kuiper sales teams (PAMs, PDMs, TPMs, PSMs, TAMs) to manage the structured partner onboarding journey from pre-contract engagement through post-launch operations.

Built with Astro.js, React, Tailwind CSS, and Netlify Blobs for data persistence.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [User Guides](#user-guides)
- [Contributing](#contributing)

## Features

- **Gate-Based Progress Tracking**: Track partners through Pre-Contract, Gate 0-3, and Post-Launch phases
- **Questionnaire Management**: Gate-specific questionnaires with pass/fail section status
- **Digital Signatures**: Capture and store digital signatures for gate approvals
- **Documentation Hub**: Centralized resources organized by gate, phase, and role
- **Role-Based Access**: Filtered views for PAM, PDM, TPM, PSM, and TAM roles
- **Reports & Analytics**: Partner progress metrics, gate completion rates, and resource utilization

## Architecture

- **Frontend**: Astro 5.x with SSR, React 19.x for interactive components
- **Styling**: Tailwind CSS 4.x
- **Data Storage**: Netlify Blobs for questionnaire submissions and partner progress
- **Authentication**: Netlify Identity for internal team access
- **Deployment**: Netlify platform

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.20.8 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (optional but recommended)
- A Netlify account with access to the project

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd partner-onboarding-hub
```

2. **Install dependencies**

```bash
npm install
```

3. **Link to Netlify project** (recommended)

```bash
netlify link
```

This ensures you're using the same runtime version for both local development and your deployed project.

4. **Set up environment variables**

Create a `.env` file in the root directory (if not already present):

```env
# Netlify Blobs (automatically configured when using netlify dev)
NETLIFY_BLOBS_CONTEXT=production

# Authentication (optional for local development)
AUTH_ENABLED=false
```

5. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Using Netlify Dev (Recommended)

For full feature parity with production (including Netlify Blobs and Identity):

```bash
netlify dev
```

This will start the development server with Netlify's local environment.

## Development

### Project Structure

```
├── src/
│   ├── components/          # React and Astro components
│   │   ├── questionnaires/  # Questionnaire-related components
│   │   └── documentation/   # Documentation hub components
│   ├── config/              # Configuration files
│   │   ├── gates.json       # Gate definitions
│   │   ├── documentation.json # Documentation links
│   │   └── questionnaires/  # Questionnaire configurations
│   ├── layouts/             # Page layouts
│   ├── middleware/          # Authentication middleware
│   ├── pages/               # Astro pages and API routes
│   │   ├── api/             # API endpoints
│   │   ├── partner/         # Partner detail pages
│   │   └── questionnaires/  # Questionnaire pages
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── tests/                   # Integration tests
└── public/                  # Static assets
```

### Available Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm test`                | Run unit tests with Vitest                       |
| `npm run test:integration`| Run integration tests with Playwright            |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `netlify dev`             | Start dev server with Netlify environment        |
| `netlify deploy`          | Deploy to Netlify (draft)                        |
| `netlify deploy --prod`   | Deploy to production                             |

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Integration Tests

Run end-to-end tests with Playwright:

```bash
npm run test:integration
```

Run tests in UI mode:

```bash
npm run test:integration:ui
```

### Test Coverage

Generate test coverage report:

```bash
npm run test:coverage
```

## Deployment

The Partner Onboarding Hub is deployed on Netlify with automatic deployments from the main branch.

### Quick Deployment

```bash
# Build the project
npm run build

# Deploy to staging (draft URL)
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Comprehensive Guides

- **[Deployment Guide](./docs/DEPLOYMENT-GUIDE.md)** - Complete deployment instructions
- **[Deployment Checklist](./docs/DEPLOYMENT-CHECKLIST.md)** - Pre and post-deployment checklist

### Key Configuration

The project includes a `netlify.toml` configuration file with:
- Build settings
- Security headers
- Caching rules
- Redirect rules
- Environment-specific settings

### Environment Variables

Required environment variables (set in Netlify Dashboard):

```
NETLIFY_BLOBS_CONTEXT=production
AUTH_ENABLED=true
```

### Automated Deployment

- **Main branch** → Production deployment
- **Pull requests** → Deploy preview
- **Other branches** → Branch deploys (optional)

## Configuration

### Questionnaire Configuration

Questionnaires are configured via JSON files in `src/config/questionnaires/`. Each questionnaire follows this structure:

```json
{
  "id": "questionnaire-id",
  "version": "1.0.0",
  "metadata": {
    "name": "Questionnaire Name",
    "description": "Description",
    "gate": "gate-id",
    "estimatedTime": 30,
    "requiredRoles": ["PAM", "PDM"],
    "primaryRole": "PAM"
  },
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "fields": [...]
    }
  ]
}
```

See [QUESTIONNAIRE-CONFIG.md](./docs/QUESTIONNAIRE-CONFIG.md) for detailed documentation.

### Gate Configuration

Gates are defined in `src/config/gates.json`. Each gate includes:

- Gate ID and name
- Description
- Associated questionnaires
- Estimated timeline
- Completion criteria

### Documentation Links

Documentation links are managed in `src/config/documentation.json`, organized by:

- Gate (Pre-Contract, Gate 0-3, Post-Launch)
- Phase (1A, 1B, 1C, etc.)
- Relevant roles

## User Guides

Role-specific user guides are available in the `docs/user-guides/` directory:

- [PAM User Guide](./docs/user-guides/PAM-GUIDE.md) - Partner Account Manager
- [PDM User Guide](./docs/user-guides/PDM-GUIDE.md) - Partner Development Manager
- [TPM User Guide](./docs/user-guides/TPM-GUIDE.md) - Technical Program Manager
- [PSM User Guide](./docs/user-guides/PSM-GUIDE.md) - Partner Success Manager
- [TAM User Guide](./docs/user-guides/TAM-GUIDE.md) - Technical Account Manager

## Contributing

### Code Style

- Follow existing code patterns
- Use TypeScript for type safety
- Write tests for new features
- Update documentation as needed

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test && npm run test:integration`
4. Build the project: `npm run build`
5. Submit a pull request with a clear description

### Adding New Questionnaires

1. Create a JSON configuration file in `src/config/questionnaires/`
2. Create a corresponding Astro page in `src/pages/questionnaires/`
3. Update `src/config/gates.json` to reference the new questionnaire
4. Add tests for the new questionnaire
5. Update documentation

## Support

For questions or issues:

- Check the [user guides](./docs/user-guides/)
- Review the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
- Contact the development team

## License

Internal use only - Kuiper Partner Onboarding Hub
