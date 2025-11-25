# Implementation Plan: Partner Onboarding Hub Improvements

## Phase 0: Foundation

- [x] 1. Consolidate user roles from 6 to 4
  - Update UserRole type definition to only include PAM, PDM, TAM, PSM
  - Remove tpmOwner field from PartnerRecord interface
  - Update all type imports across the codebase
  - _Requirements: Role Consolidation_

- [x] 1.1 Write unit tests for role type validation
  - Test that only valid roles are accepted
  - Test legacy data migration
  - _Requirements: Role Consolidation_

- [x] 1.2 Update partner data migration utility
  - Create function to handle legacy partners with tpmOwner
  - Add logging for audit trail when tpmOwner is removed
  - Test with sample legacy data
  - _Requirements: Role Consolidation_

- [x] 1.3 Write property test for role consolidation
  - **Property 32: Role validity**
  - **Validates: Role Consolidation**

## Phase 1: Quick Wins (High Priority)

- [x] 2. Update gate navigation labels
  - Update HubLayout navigation to use descriptive gate names
  - Create GATE_LABELS constant with full names
  - Apply labels to all gate navigation buttons
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 2.1 Write property test for gate label format
  - **Property 15: Gate label format**
  - **Validates: Requirements 6.1**

- [x] 3. Implement PAM/role reassignment on partner edit
- [x] 3.1 Create user list API endpoint
  - Implement GET /api/users with role filtering
  - Fetch users from Auth0 with role metadata
  - Return filtered list based on role query parameter
  - _Requirements: 1.2_

- [x] 3.2 Write property test for PAM dropdown population
  - **Property 1: PAM dropdown population**
  - **Validates: Requirements 1.2**

- [x] 3.3 Update partner edit form with role dropdowns
  - Add dropdowns for PAM, PDM, TAM, PSM owners
  - Fetch and populate dropdown options from API
  - Handle loading and error states
  - _Requirements: 1.1, 1.2_

- [x] 3.4 Implement partner owner update logic
  - Update partner record with selected owner emails
  - Validate email format and role assignment
  - Save updated partner to storage
  - _Requirements: 1.3, 1.4_

- [x] 3.5 Write property tests for PAM owner updates
  - **Property 2: PAM owner update**
  - **Property 3: PAM owner persistence**
  - **Validates: Requirements 1.3, 1.4**

- [x] 4. Implement questionnaire submission editing
- [x] 4.1 Add edit buttons to partner detail page
  - Display "Edit" button next to each completed questionnaire
  - Calculate edit permissions based on user role and partner ownership
  - Generate edit URLs with submissionId and mode=edit
  - _Requirements: 7.1_

- [x] 4.2 Write property test for edit button display
  - **Property 16: Questionnaire edit button display**
  - **Validates: Requirements 7.1**

- [x] 4.3 Update questionnaire pages to support edit mode
  - Detect edit mode from URL parameters (submissionId, mode)
  - Load existing submission data when in edit mode
  - Pre-populate form fields with existing values
  - Display "Editing" indicator in UI
  - _Requirements: 7.2, 7.3_

- [x] 4.4 Write property test for questionnaire pre-population
  - **Property 17: Questionnaire pre-population**
  - **Validates: Requirements 7.3**

- [x] 4.5 Create submission update API endpoint
  - Implement PUT /api/submission/[id]
  - Validate user permissions before allowing update
  - Update existing submission record (not create new)
  - Update updatedAt timestamp
  - _Requirements: 7.4, 7.5, 7.6_

- [x] 4.6 Write property tests for submission updates
  - **Property 18: Questionnaire update (not create)**
  - **Property 19: Questionnaire update timestamp**
  - **Validates: Requirements 7.5, 7.6**

- [x] 4.7 Update partner detail to show edit history
  - Display last updated date for each questionnaire
  - Show "Edited" badge if updatedAt differs from createdAt
  - _Requirements: 7.7_

- [x] 4.8 Write property test for questionnaire history display
  - **Property 20: Questionnaire history display**
  - **Validates: Requirements 7.7**

- [x] 5. Checkpoint - Ensure all Phase 1 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Core Functionality (Medium Priority)

- [ ] 6. Implement questionnaire template management
- [ ] 6.1 Create template data models and storage utilities
  - Define QuestionnaireTemplate and QuestionField interfaces
  - Implement template storage in Netlify Blobs (current + versions)
  - Create template CRUD utilities (get, update, version)
  - _Requirements: 8.9_

- [ ] 6.2 Write property test for template version increment
  - **Property 27: Template version increment**
  - **Validates: Requirements 8.9**

- [ ] 6.3 Create template list page
  - Implement /admin/templates/index.astro
  - Display all questionnaire types (Pre-Contract, Gate 0-3, Post-Launch)
  - Add "Manage Templates" link to admin navigation
  - Restrict access to PDM role only
  - _Requirements: 8.1, 8.2_

- [ ] 6.4 Create template editor page
  - Implement /admin/templates/[templateId]/edit.astro
  - Load current template data
  - Display all fields in editable list
  - _Requirements: 8.3_

- [ ] 6.5 Write property test for template editor field display
  - **Property 21: Template editor field display**
  - **Validates: Requirements 8.3**

- [ ] 6.6 Implement field editor component
  - Create FieldEditor React component
  - Support editing field properties (label, helpText, placeholder, required)
  - Support field type selection (text, textarea, select, radio, checkbox, date)
  - Add options editor for select/radio/checkbox types
  - _Requirements: 8.4, 8.7, 8.8_

- [ ] 6.7 Write property tests for field editing
  - **Property 22: Field type support**
  - **Property 25: Field property updates**
  - **Property 26: Option-based field options**
  - **Validates: Requirements 8.4, 8.7, 8.8**

- [ ] 6.8 Implement field reordering
  - Add move up/down buttons to each field
  - Update field order values when reordering
  - Maintain consistent ordering in template
  - _Requirements: 8.5_

- [ ] 6.9 Write property test for field reordering
  - **Property 23: Field reordering**
  - **Validates: Requirements 8.5**

- [ ] 6.10 Implement field removal
  - Add delete button with confirmation dialog
  - Remove field from template fields array
  - _Requirements: 8.6_

- [ ] 6.11 Write property test for field removal
  - **Property 24: Field removal**
  - **Validates: Requirements 8.6**

- [ ] 6.12 Implement add new field functionality
  - Add "Add Field" button to template editor
  - Create new field with default values
  - Generate unique field ID
  - _Requirements: 8.4_

- [ ] 6.13 Create template validation utility
  - Validate no duplicate field IDs
  - Validate all fields have labels
  - Validate select/radio/checkbox fields have options
  - Display validation errors inline
  - _Requirements: 8.4, 8.7, 8.8_

- [ ] 6.14 Implement template save with versioning
  - Create new version when template is saved
  - Store previous version in versions storage
  - Increment version number
  - Update current template
  - _Requirements: 8.9_

- [ ] 6.15 Create template API endpoints
  - Implement GET /api/templates (list all)
  - Implement GET /api/templates/[id] (get specific)
  - Implement PUT /api/templates/[id] (update)
  - Implement GET /api/templates/[id]/versions (version history)
  - Implement GET /api/templates/[id]/versions/[version] (specific version)
  - _Requirements: 8.3, 8.9_

- [ ] 6.16 Update questionnaire rendering to use templates
  - Load template for questionnaire type
  - Dynamically render form fields based on template
  - Store templateVersion with submission
  - _Requirements: 8.10_

- [ ] 6.17 Write property test for new submissions using current template
  - **Property 28: New submissions use current template**
  - **Validates: Requirements 8.10**

- [ ] 6.18 Implement historical submission rendering
  - Load template version from submission.templateVersion
  - Render questionnaire using historical template
  - Fall back to current template if version not found
  - _Requirements: 8.11_

- [ ] 6.19 Write property test for historical template preservation
  - **Property 29: Historical submission template preservation**
  - **Validates: Requirements 8.10, 8.11**

- [ ] 6.20 Create template preview page
  - Implement /admin/templates/[templateId]/preview.astro
  - Render questionnaire form as users will see it
  - Use same rendering logic as actual questionnaires
  - _Requirements: 8.12_

- [ ] 6.21 Write property test for preview rendering consistency
  - **Property 30: Preview rendering consistency**
  - **Validates: Requirements 8.12**

- [ ] 6.22 Implement removed field handling
  - New submissions exclude removed fields
  - Existing submissions retain removed field data
  - Display removed fields in historical view with indicator
  - _Requirements: 8.13_

- [ ] 6.23 Write property test for removed field exclusion
  - **Property 31: Removed field exclusion**
  - **Validates: Requirements 8.13**

- [ ] 7. Implement partner-centric questionnaire flow
- [ ] 7.1 Create gate view pages
  - Implement /questionnaires/[gateId]/index.astro
  - Filter and display partners by current gate
  - Show partner cards with key information
  - _Requirements: 5.1_

- [ ] 7.2 Write property test for gate view filtering
  - **Property 11: Gate view filtering**
  - **Validates: Requirements 5.1**

- [ ] 7.3 Update partner detail page with questionnaire section
  - Add "Add Gate Questionnaire" button for current gate
  - Display completed questionnaires list
  - Show questionnaire status and dates
  - _Requirements: 5.2, 5.5_

- [ ] 7.4 Write property tests for questionnaire display
  - **Property 12: Questionnaire button text**
  - **Property 14: Partner questionnaire display**
  - **Validates: Requirements 5.2, 5.5**

- [ ] 7.5 Implement questionnaire navigation from partner page
  - Generate questionnaire URL with partnerId pre-filled
  - Navigate to questionnaire form on button click
  - Return to partner detail after submission
  - _Requirements: 5.3, 5.4_

- [ ] 7.6 Write property test for questionnaire navigation
  - **Property 13: Navigation URLs**
  - **Validates: Requirements 5.3**

- [ ] 8. Implement reports population
- [ ] 8.1 Create report calculation utilities
  - Implement calculateReportData function
  - Implement calculateGateMetrics function
  - Calculate partner counts, completion rates, timeline metrics
  - _Requirements: 2.2, 2.4_

- [ ] 8.2 Write property tests for report calculations
  - **Property 4: Gate metrics calculation**
  - **Property 5: Report data completeness**
  - **Validates: Requirements 2.2, 2.4**

- [ ] 8.3 Update reports page with data display
  - Load all partners from storage
  - Calculate and display report metrics
  - Show metrics by gate with charts/tables
  - Handle empty state when no partners exist
  - _Requirements: 2.1, 2.3_

- [ ] 9. Checkpoint - Ensure all Phase 2 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Advanced Features (Low Priority)

- [ ] 10. Implement PDM utilization tracking
- [ ] 10.1 Create utilization calculation utilities
  - Implement calculatePDMUtilization function
  - Support revenue mode (sum of CCV)
  - Support partner count mode
  - Calculate utilization percentage against target
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10.2 Write property tests for utilization calculations
  - **Property 6: PDM utilization by revenue**
  - **Property 7: PDM utilization by count**
  - **Property 8: Utilization display completeness**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 10.3 Add utilization display to PDM dashboard
  - Show current utilization metric prominently
  - Display capacity target
  - Show utilization percentage with visual indicator
  - Allow toggling between revenue and count modes
  - _Requirements: 3.5_

- [ ] 11. Implement documentation improvements (if needed)
- [ ] 11.1 Add back link to documentation page
  - Add navigation back to dashboard
  - _Requirements: 4.1_

- [ ] 11.2 Implement documentation search
  - Create search input component
  - Filter documentation by search query
  - Display matching results with excerpts
  - _Requirements: 4.2_

- [ ] 11.3 Write property test for search results
  - **Property 9: Documentation search results**
  - **Validates: Requirements 4.2**

- [ ] 11.4 Update documentation links
  - Ensure phase-specific resources navigate correctly
  - Verify contextual help links open correct sections
  - _Requirements: 4.3, 4.4_

- [ ] 11.5 Write property test for link targets
  - **Property 10: Documentation link targets**
  - **Validates: Requirements 4.4**

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
