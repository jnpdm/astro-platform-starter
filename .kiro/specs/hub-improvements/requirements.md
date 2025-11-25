# Requirements Document: Partner Onboarding Hub Improvements

## Introduction

This document outlines improvements and fixes for the Partner Onboarding Hub based on user feedback after the questionnaire loading fix was successfully deployed.

## Glossary

- **PAM**: Partner Account Manager - manages partner relationships
- **PDM**: Partner Development Manager - admin role with full access
- **Partner**: A company going through the onboarding process
- **Gate**: A phase in the partner onboarding journey (Pre-Contract, Gate 0-3, Post-Launch)
- **Questionnaire**: A form that must be completed to progress through a gate

## Requirements

### Requirement 1: PAM Reassignment on Partner Edit

**User Story:** As a PDM, I want to reassign the PAM owner when editing a partner, so that I can manage partner ownership changes.

#### Acceptance Criteria

1. WHEN a user edits a partner THEN the system SHALL display a dropdown for PAM owner selection
2. WHEN the PAM dropdown is displayed THEN the system SHALL populate it with all users who have the PAM role
3. WHEN a user selects a new PAM owner THEN the system SHALL update the partner record with the new PAM owner email
4. WHEN the partner is saved THEN the system SHALL persist the PAM owner change to storage

### Requirement 2: Reports Population

**User Story:** As a PDM or PAM, I want to see populated reports, so that I can track partner progress and metrics.

#### Acceptance Criteria

1. WHEN a user navigates to the reports page THEN the system SHALL display partner data in report format
2. WHEN partners exist in the system THEN the system SHALL calculate and display metrics for each gate
3. WHEN no partners exist THEN the system SHALL display a message indicating no data is available
4. WHEN report data is displayed THEN the system SHALL show partner count by gate, completion rates, and timeline metrics

### Requirement 3: PDM Utilization Tracking

**User Story:** As a PDM, I want to track my utilization as a primary KPI, so that I can measure my workload and capacity.

#### Acceptance Criteria

1. WHEN calculating PDM utilization THEN the system SHALL provide options to track by revenue or by partner count
2. WHEN tracking by revenue THEN the system SHALL sum the CCV (Contract Committed Value) of all partners assigned to the PDM
3. WHEN tracking by partner count THEN the system SHALL count the number of active partners assigned to the PDM
4. WHEN displaying utilization THEN the system SHALL show current utilization against a configurable capacity target
5. WHEN a PDM views their dashboard THEN the system SHALL prominently display their utilization metric

### Requirement 4: Documentation Improvements

**User Story:** As a user, I want improved documentation access, so that I can easily find relevant resources for each gate phase.

#### Acceptance Criteria

1. WHEN a user views the documentation page THEN the system SHALL provide a back link to the dashboard
2. WHEN a user searches documentation THEN the system SHALL filter and display matching results
3. WHEN phase-specific resources are clicked THEN the system SHALL navigate to or display the relevant content
4. WHEN contextual help links are clicked THEN the system SHALL open the correct documentation section
5. WHERE tooltips are implemented THEN the system SHALL display inline help without navigation

**Note:** This requirement may be deferred as documentation features may not be needed yet.

### Requirement 5: Partner-Centric Questionnaire Flow

**User Story:** As a user, I want questionnaires to be accessed through partner pages, so that the workflow is more intuitive and partner-focused.

#### Acceptance Criteria

1. WHEN a user clicks a gate navigation button THEN the system SHALL display all partners currently in that gate phase
2. WHEN a user views a partner detail page THEN the system SHALL display an "Add Gate Questionnaire" button for the partner's current gate
3. WHEN a user clicks "Add Gate Questionnaire" THEN the system SHALL navigate to the questionnaire form with the partner ID pre-filled
4. WHEN a user completes a questionnaire THEN the system SHALL return to the partner detail page
5. WHEN a partner has completed questionnaires THEN the system SHALL display them on the partner detail page

### Requirement 6: Improved Gate Navigation Labels

**User Story:** As a user, I want descriptive gate names in navigation, so that I can quickly identify which gate I'm viewing.

#### Acceptance Criteria

1. WHEN gate navigation buttons are displayed THEN the system SHALL show both the gate number and descriptive name
2. WHEN displaying Gate 0 THEN the system SHALL show "Gate 0: Onboarding Kickoff"
3. WHEN displaying Gate 1 THEN the system SHALL show "Gate 1: Ready to Sell"
4. WHEN displaying Gate 2 THEN the system SHALL show "Gate 2: Ready to Order"
5. WHEN displaying Gate 3 THEN the system SHALL show "Gate 3: Ready to Deliver"
6. WHEN displaying Pre-Contract THEN the system SHALL show "Pre-Contract: PDM Engagement"
7. WHEN displaying Post-Launch THEN the system SHALL show "Post-Launch"

### Requirement 7: Questionnaire Submission Editing

**User Story:** As a PAM or PDM, I want to edit previously submitted questionnaires, so that I can correct errors or update information as circumstances change.

#### Acceptance Criteria

1. WHEN a user views a partner detail page with completed questionnaires THEN the system SHALL display an "Edit" button next to each questionnaire
2. WHEN a user clicks "Edit" on a questionnaire THEN the system SHALL navigate to the questionnaire form pre-populated with existing data
3. WHEN a questionnaire is loaded in edit mode THEN the system SHALL display all previously submitted answers
4. WHEN a user modifies questionnaire answers THEN the system SHALL update the submission data
5. WHEN a user saves an edited questionnaire THEN the system SHALL update the existing submission record (not create a new one)
6. WHEN a questionnaire is updated THEN the system SHALL update the updatedAt timestamp
7. WHEN a user views questionnaire history THEN the system SHALL show the last updated date for edited questionnaires

### Requirement 8: Questionnaire Template Management

**User Story:** As a PDM administrator, I want to edit questionnaire templates, so that I can add, remove, or modify questions without requiring code changes.

#### Acceptance Criteria

1. WHEN a PDM accesses the admin section THEN the system SHALL display a "Manage Templates" navigation option
2. WHEN viewing the template management page THEN the system SHALL list all questionnaire types (Pre-Contract, Gate 0, Gate 1, Gate 2, Gate 3, Post-Launch)
3. WHEN a PDM selects a questionnaire template THEN the system SHALL display the template editor with all current questions
4. WHEN editing a template THEN the system SHALL support adding new questions with field type selection (text, textarea, select, radio, checkbox, date)
5. WHEN editing a template THEN the system SHALL support reordering questions via drag-and-drop or move up/down controls
6. WHEN editing a template THEN the system SHALL support removing questions with confirmation prompt
7. WHEN editing a template THEN the system SHALL support modifying question text, help text, placeholder text, and required status
8. WHEN a question field type is select, radio, or checkbox THEN the system SHALL allow defining option values
9. WHEN a template is saved THEN the system SHALL version the template and store it with a version number
10. WHEN a template is updated THEN the system SHALL apply changes to new questionnaire submissions
11. WHEN viewing a historical submission THEN the system SHALL display the questionnaire using the template version active at submission time
12. WHEN a PDM previews a template THEN the system SHALL render the questionnaire form as users will see it
13. WHEN a question is removed from a template THEN the system SHALL retain historical data but exclude the question from new submissions

## Priority

1. **High Priority** (Quick wins):
   - Requirement 6: Improved Gate Navigation Labels (UI text change)
   - Requirement 1: PAM Reassignment (dropdown implementation)
   - Requirement 7: Questionnaire Submission Editing (core functionality)

2. **Medium Priority** (Core functionality):
   - Requirement 8: Questionnaire Template Management (admin feature)
   - Requirement 5: Partner-Centric Questionnaire Flow (UX improvement)
   - Requirement 2: Reports Population (data display)

3. **Low Priority** (Nice to have):
   - Requirement 3: PDM Utilization Tracking (new feature)
   - Requirement 4: Documentation Improvements (may defer)

## Out of Scope

- Complete documentation system overhaul
- Advanced reporting and analytics
- Automated notifications and reminders
- Complex workflow automation or approval processes
- Multi-language support for questionnaires
- Conditional logic or branching in questionnaires (questions that appear based on previous answers)
