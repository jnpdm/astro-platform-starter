# Integration Tests

This directory contains Playwright-based integration tests for the Kuiper Partner Onboarding Hub.

## Overview

The integration tests validate:

1. **Complete questionnaire submission flow** - Tests the full user journey from opening a questionnaire to submitting with signature
2. **Gate progression logic** - Validates that gates block progression when criteria aren't met
3. **Signature capture and storage** - Tests both typed and drawn signature modes with metadata capture
4. **Role-based access control** - Verifies that users see appropriate content based on their role
5. **Data persistence to Netlify Blobs** - Tests API endpoints and data storage/retrieval

## Test Files

- `questionnaire-submission.spec.ts` - Tests questionnaire forms, validation, section navigation, and signature capture
- `gate-progression.spec.ts` - Tests gate blocking, status updates, and progression rules
- `data-persistence.spec.ts` - Tests API endpoints and Netlify Blobs storage
- `role-based-access.spec.ts` - Tests authentication and role-based filtering
- `end-to-end.spec.ts` - Complete user workflows and edge cases

## Running Tests

### Run all integration tests
```bash
npm run test:integration
```

### Run tests in UI mode (interactive)
```bash
npm run test:integration:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:integration:headed
```

### Run tests in debug mode
```bash
npm run test:integration:debug
```

### Run specific test file
```bash
npx playwright test questionnaire-submission
```

### Run specific test
```bash
npx playwright test -g "should display pre-contract questionnaire form"
```

## Requirements Coverage

These integration tests validate all requirements from the specification:

### Requirement 1: Gate-Based Partner Progress Tracking
- ✅ Dashboard displays partners by gate
- ✅ Gate status and completion percentage
- ✅ Automatic status updates
- ✅ Blocking when criteria not met

### Requirement 2: Internal Pass/Fail Section Status
- ✅ Section status display with visual indicators
- ✅ Aggregate status views
- ✅ Failure reason display

### Requirement 3: Digital Signature Capture
- ✅ Typed and drawn signature modes
- ✅ Metadata capture (timestamp, IP, user agent)
- ✅ Signature storage and retrieval
- ✅ Terms acceptance requirement

### Requirement 4: Pre-Contract PDM Engagement Questionnaire
- ✅ Five-section questionnaire
- ✅ Qualification criteria validation
- ✅ Pass/fail status calculation

### Requirement 5: Documentation Hub Integration
- ✅ Documentation organized by gate and phase
- ✅ Role-based filtering
- ✅ Contextual help links

### Requirement 6: Multi-Gate Questionnaire Support
- ✅ All five questionnaires (Pre-Contract, Gate 0-3)
- ✅ Gate blocking logic
- ✅ Phase organization

### Requirement 7: Data Persistence and Retrieval
- ✅ Questionnaire submission storage
- ✅ Partner record storage
- ✅ Data retrieval by ID
- ✅ Filtering and search

### Requirement 8: User Interface and Experience
- ✅ Responsive design (tablet and desktop)
- ✅ Form validation and error messages
- ✅ Progress indicators
- ✅ Touch-friendly buttons

### Requirement 9: Role-Based Authentication and Access Control
- ✅ Authentication requirement
- ✅ Role identification
- ✅ Role-based partner filtering
- ✅ Role-based documentation filtering

### Requirement 10: Reporting and Analytics
- ✅ Summary statistics
- ✅ Partner distribution
- ✅ Gate analytics
- ✅ Report export

## Test Environment

The tests run against a local development server started automatically by Playwright. The server runs on `http://localhost:4321`.

### Prerequisites

1. Node.js and npm installed
2. All project dependencies installed (`npm install`)
3. Playwright browsers installed (`npx playwright install`)

### Environment Variables

The tests use the same environment variables as the main application:

- `NETLIFY_BLOBS_CONTEXT` - Blobs storage context
- `NETLIFY_SITE_ID` - Netlify site ID
- `AUTH_ENABLED` - Enable/disable authentication

## Test Data

The tests create temporary test data with IDs like:
- `test-partner-${timestamp}`
- `test-submission-${timestamp}`

This ensures tests don't conflict with each other or production data.

## Debugging Tests

### View test report
```bash
npx playwright show-report
```

### Run with trace viewer
```bash
npx playwright test --trace on
```

### Take screenshots on failure
Screenshots are automatically captured on test failures and saved to `test-results/`.

## CI/CD Integration

The tests are configured to run in CI environments with:
- 2 retries on failure
- HTML reporter for results
- Automatic server startup
- Screenshot and trace capture on failure

## Known Limitations

1. **Authentication**: Tests run without full Netlify Identity integration. They verify the UI elements exist but don't test actual login flows.

2. **Netlify Blobs**: Tests may fail if Netlify Blobs is not properly configured. They gracefully handle storage errors.

3. **Network Conditions**: Tests assume reasonable network speeds. Slow connections may cause timeouts.

4. **Browser Support**: Tests run on Chromium by default. Add more browsers in `playwright.config.ts` if needed.

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add comments explaining complex test logic
4. Reference requirement numbers in test descriptions
5. Handle edge cases gracefully (tests should not fail if features are not yet implemented)
6. Use appropriate timeouts and waits
7. Clean up test data after tests complete

## Troubleshooting

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check that dev server starts properly
- Verify network connectivity

### Tests fail intermittently
- Add explicit waits for dynamic content
- Check for race conditions
- Ensure tests are independent

### Storage errors
- Verify Netlify Blobs configuration
- Check environment variables
- Ensure proper permissions

### Authentication errors
- Verify Netlify Identity setup
- Check authentication middleware
- Ensure proper session handling
