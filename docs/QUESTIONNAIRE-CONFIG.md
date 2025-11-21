# Questionnaire Configuration Guide

## Overview

Questionnaires in the Partner Onboarding Hub are configured using JSON files. This guide explains the structure and how to create or modify questionnaires.

## Configuration File Location

Questionnaire configuration files are stored in:
```
src/config/questionnaires/
```

## File Naming Convention

Use kebab-case for questionnaire IDs:
- `pre-contract-pdm.json`
- `gate-0-kickoff.json`
- `gate-1-ready-to-sell.json`
- `gate-2-ready-to-order.json`
- `gate-3-ready-to-deliver.json`

## Configuration Structure

### Root Object

```json
{
  "id": "string",
  "version": "string",
  "metadata": { },
  "sections": [ ],
  "validation": { },
  "documentation": [ ],
  "gateCriteria": [ ]
}
```

### Metadata Object

```json
{
  "metadata": {
    "name": "Questionnaire Display Name",
    "description": "Brief description of the questionnaire purpose",
    "gate": "gate-id",
    "phase": "1A",
    "estimatedTime": 30,
    "icon": "📋",
    "requiredRoles": ["PAM", "PDM"],
    "primaryRole": "PAM"
  }
}
```

**Fields**:
- `name` (required): Display name shown to users
- `description` (required): Brief description of purpose
- `gate` (required): Associated gate ID (pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch)
- `phase` (optional): Phase within gate (1A, 1B, 1C, 2A, 2B, 3A, 3B)
- `estimatedTime` (required): Estimated completion time in minutes
- `icon` (optional): Emoji or icon for visual identification
- `requiredRoles` (required): Array of roles that must complete this questionnaire
- `primaryRole` (required): Role that leads completion

### Sections Array

Each questionnaire contains one or more sections:

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "description": "Optional section description",
      "fields": [ ],
      "passFailCriteria": { },
      "documentationLinks": [ ]
    }
  ]
}
```

**Section Fields**:
- `id` (required): Unique identifier for the section
- `title` (required): Display title
- `description` (optional): Additional context
- `fields` (required): Array of form fields
- `passFailCriteria` (optional): Criteria for pass/fail evaluation
- `documentationLinks` (optional): Relevant documentation

### Field Types

#### Text Field

```json
{
  "id": "partner-name",
  "type": "text",
  "label": "Partner Name",
  "required": true,
  "helpText": "Enter the official partner company name",
  "validation": {
    "minLength": 2,
    "maxLength": 100
  }
}
```

#### Email Field

```json
{
  "id": "contact-email",
  "type": "email",
  "label": "Contact Email",
  "required": true,
  "helpText": "Primary contact email address",
  "validation": {
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
  }
}
```

#### Date Field

```json
{
  "id": "target-date",
  "type": "date",
  "label": "Target Launch Date",
  "required": true,
  "helpText": "Expected date for partner launch",
  "validation": {
    "min": "2024-01-01",
    "max": "2025-12-31"
  }
}
```

#### Number Field

```json
{
  "id": "ccv-amount",
  "type": "number",
  "label": "Contractually Committed Value (CCV)",
  "required": true,
  "helpText": "Enter CCV in USD",
  "validation": {
    "min": 0,
    "max": 1000000000
  }
}
```

#### Select Field

```json
{
  "id": "tier",
  "type": "select",
  "label": "Partner Tier",
  "required": true,
  "options": [
    "Tier 0",
    "Tier 1",
    "Tier 2"
  ],
  "helpText": "Select the partner tier classification"
}
```

#### Radio Field

```json
{
  "id": "executive-sponsorship",
  "type": "radio",
  "label": "Is executive sponsorship confirmed?",
  "required": true,
  "options": [
    "Yes - Executive sponsor identified and committed",
    "No - No executive sponsor",
    "Partial - Executive interest but not committed"
  ]
}
```

#### Checkbox Field

```json
{
  "id": "agreement",
  "type": "checkbox",
  "label": "I confirm all information is accurate",
  "required": true
}
```

#### Textarea Field

```json
{
  "id": "technical-questions",
  "type": "textarea",
  "label": "Technical Questions",
  "required": false,
  "helpText": "List any technical questions or concerns",
  "validation": {
    "maxLength": 2000
  }
}
```

### Field Validation

Common validation rules:

```json
{
  "validation": {
    "required": true,
    "minLength": 5,
    "maxLength": 100,
    "min": 0,
    "max": 1000,
    "pattern": "^[A-Za-z0-9]+$",
    "custom": "customValidationFunction"
  }
}
```

### Pass/Fail Criteria

Define how sections are evaluated:

#### Manual Evaluation

```json
{
  "passFailCriteria": {
    "type": "manual",
    "instructions": "Review responses and manually mark as pass or fail"
  }
}
```

#### Automatic Evaluation

```json
{
  "passFailCriteria": {
    "type": "automatic",
    "rules": [
      {
        "field": "executive-sponsorship",
        "condition": "equals",
        "value": "Yes - Executive sponsor identified and committed",
        "failureMessage": "Executive sponsorship must be confirmed"
      },
      {
        "field": "ccv-amount",
        "condition": "greaterThan",
        "value": 1000000,
        "failureMessage": "CCV must be greater than $1M"
      }
    ]
  }
}
```

**Supported Conditions**:
- `equals`: Field value must equal specified value
- `notEquals`: Field value must not equal specified value
- `greaterThan`: Numeric field must be greater than value
- `lessThan`: Numeric field must be less than value
- `greaterThanOrEqual`: Numeric field must be >= value
- `lessThanOrEqual`: Numeric field must be <= value
- `contains`: String field must contain substring
- `notContains`: String field must not contain substring
- `matches`: Field must match regex pattern

### Documentation Links

Link to relevant documentation:

```json
{
  "documentationLinks": [
    {
      "title": "Executive Sponsorship Guide",
      "url": "/docs/executive-sponsorship",
      "type": "internal",
      "description": "How to validate executive commitment"
    },
    {
      "title": "Partner Tier Classification",
      "url": "https://example.com/tier-guide",
      "type": "external",
      "description": "Detailed tier classification criteria"
    }
  ]
}
```

### Gate Criteria

List the gate criteria this questionnaire validates:

```json
{
  "gateCriteria": [
    "Executive Sponsorship Confirmed",
    "Commercial Framework Alignment",
    "Technical Feasibility Questions Identified",
    "Near-Term Closure Timeline",
    "Strategic Partner Classification"
  ]
}
```

## Complete Example

```json
{
  "id": "pre-contract-pdm",
  "version": "1.0.0",
  "metadata": {
    "name": "Pre-Contract PDM Engagement Checklist",
    "description": "Validates qualification criteria for PDM support before contract signature",
    "gate": "pre-contract",
    "estimatedTime": 30,
    "icon": "📋",
    "requiredRoles": ["PAM", "PDM"],
    "primaryRole": "PAM"
  },
  "gateCriteria": [
    "Executive Sponsorship Confirmed",
    "Commercial Framework Alignment",
    "Technical Feasibility Questions Identified",
    "Near-Term Closure Timeline",
    "Strategic Partner Classification"
  ],
  "sections": [
    {
      "id": "executive-sponsorship",
      "title": "Executive Sponsorship Confirmed",
      "description": "Verify executive-level commitment from partner",
      "fields": [
        {
          "id": "has-executive-sponsor",
          "type": "radio",
          "label": "Is executive sponsorship confirmed?",
          "required": true,
          "options": [
            "Yes - Executive sponsor identified and committed",
            "No - No executive sponsor",
            "Partial - Executive interest but not committed"
          ]
        },
        {
          "id": "sponsor-name",
          "type": "text",
          "label": "Executive Sponsor Name",
          "required": true,
          "helpText": "Name and title of executive sponsor"
        },
        {
          "id": "sponsor-engagement",
          "type": "textarea",
          "label": "Describe sponsor engagement",
          "required": true,
          "helpText": "How has the sponsor demonstrated commitment?"
        }
      ],
      "passFailCriteria": {
        "type": "automatic",
        "rules": [
          {
            "field": "has-executive-sponsor",
            "condition": "equals",
            "value": "Yes - Executive sponsor identified and committed",
            "failureMessage": "Executive sponsorship must be confirmed for PDM engagement"
          }
        ]
      },
      "documentationLinks": [
        {
          "title": "Executive Sponsorship Validation Guide",
          "url": "/docs/exec-sponsorship",
          "type": "internal",
          "description": "How to validate executive commitment"
        }
      ]
    }
  ],
  "validation": {
    "requireAllSectionsPass": true,
    "allowPartialSave": true
  },
  "documentation": [
    {
      "title": "Pre-Contract Engagement Guidelines",
      "url": "/docs/pre-contract-guidelines",
      "type": "internal"
    }
  ]
}
```

## Creating a New Questionnaire

### Step 1: Create Configuration File

1. Create a new JSON file in `src/config/questionnaires/`
2. Use kebab-case naming: `my-new-questionnaire.json`
3. Follow the structure outlined above

### Step 2: Define Metadata

```json
{
  "id": "my-new-questionnaire",
  "version": "1.0.0",
  "metadata": {
    "name": "My New Questionnaire",
    "description": "Description of purpose",
    "gate": "gate-1",
    "estimatedTime": 45,
    "requiredRoles": ["PAM"],
    "primaryRole": "PAM"
  }
}
```

### Step 3: Add Sections and Fields

Define sections with appropriate fields for your use case.

### Step 4: Configure Pass/Fail Criteria

Decide if evaluation is manual or automatic, and define rules.

### Step 5: Add Documentation Links

Link to relevant resources for users completing the questionnaire.

### Step 6: Update Gates Configuration

Add your questionnaire to `src/config/gates.json`:

```json
{
  "id": "gate-1",
  "name": "Gate 1: Ready to Sell",
  "questionnaires": ["gate-1-ready-to-sell", "my-new-questionnaire"],
  ...
}
```

### Step 7: Create Page Component

Create an Astro page in `src/pages/questionnaires/`:

```astro
---
import HubLayout from '../../layouts/HubLayout.astro';
import QuestionnaireFormWrapper from '../../components/questionnaires/QuestionnaireFormWrapper.tsx';
import config from '../../config/questionnaires/my-new-questionnaire.json';
---

<HubLayout title={config.metadata.name}>
  <QuestionnaireFormWrapper config={config} client:load />
</HubLayout>
```

### Step 8: Add Tests

Create tests for your questionnaire in `src/components/questionnaires/`:

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyNewQuestionnaire from './MyNewQuestionnaire';

describe('MyNewQuestionnaire', () => {
  test('renders all sections', () => {
    // Test implementation
  });
});
```

### Step 9: Update Documentation

Add your questionnaire to the documentation hub configuration.

## Best Practices

### Field Design

1. **Use Clear Labels**: Make field labels descriptive and unambiguous
2. **Provide Help Text**: Add helpful context for complex fields
3. **Set Appropriate Validation**: Validate input to prevent errors
4. **Use Appropriate Field Types**: Choose the right field type for the data
5. **Make Required Fields Clear**: Mark required fields explicitly

### Section Organization

1. **Logical Grouping**: Group related fields together
2. **Progressive Disclosure**: Start with simple fields, progress to complex
3. **Reasonable Length**: Keep sections to 5-10 fields when possible
4. **Clear Titles**: Use descriptive section titles
5. **Add Context**: Provide section descriptions when helpful

### Pass/Fail Criteria

1. **Be Specific**: Define clear, measurable criteria
2. **Provide Feedback**: Include helpful failure messages
3. **Consider Edge Cases**: Think about boundary conditions
4. **Test Thoroughly**: Validate criteria logic works as expected
5. **Document Rationale**: Explain why criteria are important

### Documentation

1. **Link Relevant Resources**: Provide contextual documentation
2. **Keep Links Current**: Regularly review and update links
3. **Use Internal Links**: Prefer internal documentation when available
4. **Add Descriptions**: Explain what each link provides
5. **Organize by Relevance**: Put most important links first

## Validation and Testing

### Validate JSON Structure

Use a JSON validator to ensure your configuration is valid:

```bash
npm run validate-config
```

### Test Questionnaire Rendering

1. Start the development server
2. Navigate to your questionnaire page
3. Verify all fields render correctly
4. Test validation rules
5. Test pass/fail criteria
6. Verify documentation links work

### Test Data Submission

1. Fill out the questionnaire
2. Submit the form
3. Verify data is saved correctly
4. Check pass/fail status is calculated correctly
5. Verify signature capture works

## Troubleshooting

### Questionnaire Not Appearing

- Check file is in correct directory
- Verify JSON is valid
- Ensure questionnaire is referenced in gates.json
- Check page component exists

### Fields Not Rendering

- Verify field type is supported
- Check field ID is unique
- Ensure required properties are present
- Review browser console for errors

### Validation Not Working

- Check validation rules syntax
- Verify field IDs match
- Test with various inputs
- Review validation logic

### Pass/Fail Criteria Not Evaluating

- Verify criteria type (manual vs automatic)
- Check rule conditions are correct
- Ensure field values match expected format
- Test with different responses

## Version Control

When updating questionnaires:

1. **Increment Version**: Update version number in metadata
2. **Document Changes**: Add changelog entry
3. **Test Thoroughly**: Verify changes don't break existing functionality
4. **Migrate Data**: Plan for migrating existing submissions if needed
5. **Communicate Changes**: Notify users of significant changes

## Support

For questions or issues with questionnaire configuration:

- Review this guide
- Check existing questionnaire examples
- Consult the development team
- Submit a support ticket

## Additional Resources

- [TypeScript Type Definitions](../src/types/questionnaire.ts)
- [QuestionnaireForm Component](../src/components/questionnaires/QuestionnaireForm.tsx)
- [Example Questionnaires](../src/config/questionnaires/)
- [Gates Configuration](../src/config/gates.json)
