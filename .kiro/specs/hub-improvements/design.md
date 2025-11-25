# Design Document: Partner Onboarding Hub Improvements

## Overview

This design document outlines improvements to the Partner Onboarding Hub based on user feedback. The improvements focus on enhancing usability, fixing broken functionality, and adding key metrics tracking. The changes are organized into high, medium, and low priority features to enable incremental delivery.

### Role Consolidation

The system will consolidate available roles from 6 to 4:
- **Remove**: TPM (Technical Program Manager), Admin
- **Keep**: PAM (Partner Account Manager), PDM (Partner Development Manager), TAM (Technical Account Manager), PSM (Partner Success Manager)

This simplification will:
- Remove the `tpmOwner` field from PartnerRecord
- Update the UserRole type to only include the 4 active roles
- Maintain backward compatibility by handling legacy data gracefully

## Architecture

### Current System
- **Frontend**: Astro with React components (using `client:only="react"` for questionnaires)
- **State Management**: React hooks and context (ToastContext)
- **Storage**: Netlify Blobs for partner and submission data
- **Authentication**: Auth0 with PAM/PDM roles
- **Routing**: Astro file-based routing

### Architectural Changes

**No major architectural changes required.** All improvements can be implemented within the existing structure:

1. **PAM Reassignment**: Add user lookup API endpoint, update edit form
2. **Reports**: Add data aggregation utilities, update reports page
3. **PDM Utilization**: Add calculation utilities, update dashboard
4. **Documentation**: Update existing documentation page
5. **Partner-Centric Flow**: Add gate view pages, update navigation
6. **Gate Labels**: Update navigation component with descriptive names

## Components and Interfaces

### 0. Role Consolidation

#### Updated Type Definitions
```typescript
// Updated from 6 roles to 4 roles
export type UserRole = 'PAM' | 'PDM' | 'TAM' | 'PSM';

// Updated PartnerRecord - remove tpmOwner
export interface PartnerRecord {
  id: string;
  partnerName: string;
  
  // Team Assignments (TPM removed)
  pamOwner: string;
  pdmOwner?: string;
  psmOwner?: string;
  tamOwner?: string;
  // tpmOwner removed
  
  // ... rest of fields unchanged
}
```

#### Migration Strategy
```typescript
// When loading legacy partner records with tpmOwner
function migrateLegacyPartner(partner: any): PartnerRecord {
  const { tpmOwner, ...rest } = partner;
  
  // Log if tpmOwner was present for audit purposes
  if (tpmOwner) {
    console.warn(`Partner ${partner.id} had tpmOwner: ${tpmOwner} - field removed during migration`);
  }
  
  return rest as PartnerRecord;
}
```

### 1. PAM Reassignment (Requirement 1)

#### New API Endpoint
```typescript
// GET /api/users?role=PAM (or TAM, PSM, PDM)
interface UserListResponse {
  success: boolean;
  users: Array<{
    email: string;
    name: string;
    role: 'PAM' | 'PDM' | 'TAM' | 'PSM';
  }>;
  error?: string;
}
```

#### Updated Partner Edit Form
```typescript
interface PartnerEditFormProps {
  partner: PartnerRecord;
  availablePAMs: Array<{ email: string; name: string }>;
  availableTAMs: Array<{ email: string; name: string }>;
  availablePSMs: Array<{ email: string; name: string }>;
  availablePDMs: Array<{ email: string; name: string }>;
  onSave: (updatedPartner: PartnerRecord) => Promise<void>;
}
```

### 2. Reports Population (Requirement 2)

#### Report Data Structure
```typescript
interface GateMetrics {
  gateId: GateId;
  gateName: string;
  partnerCount: number;
  completionRate: number; // Percentage of partners who completed this gate
  averageDaysInGate: number;
  partners: PartnerRecord[];
}

interface ReportData {
  totalPartners: number;
  gateMetrics: GateMetrics[];
  generatedAt: Date;
}
```

#### Report Calculation Utility
```typescript
function calculateReportData(partners: PartnerRecord[]): ReportData;
function calculateGateMetrics(partners: PartnerRecord[], gateId: GateId): GateMetrics;
```

### 3. PDM Utilization Tracking (Requirement 3)

#### Utilization Data Structure
```typescript
type UtilizationMode = 'revenue' | 'partner-count';

interface PDMUtilization {
  pdmEmail: string;
  mode: UtilizationMode;
  currentValue: number; // CCV sum or partner count
  capacityTarget: number;
  utilizationPercentage: number;
  partners: PartnerRecord[];
}
```

#### Utilization Calculation Utility
```typescript
function calculatePDMUtilization(
  partners: PartnerRecord[],
  pdmEmail: string,
  mode: UtilizationMode,
  capacityTarget: number
): PDMUtilization;
```

### 4. Documentation Improvements (Requirement 4)

#### Search Functionality
```typescript
interface DocumentationSearchResult {
  title: string;
  excerpt: string;
  url: string;
  relevanceScore: number;
}

function searchDocumentation(query: string): DocumentationSearchResult[];
```

### 5. Partner-Centric Questionnaire Flow (Requirement 5)

#### New Gate View Page
```astro
// /questionnaires/[gateId]/index.astro
// Shows all partners in a specific gate
interface GateViewProps {
  gateId: GateId;
  gateName: string;
  partners: PartnerRecord[];
}
```

#### Updated Partner Detail Page
```astro
// /partner/[id].astro
// Add questionnaire management section
interface QuestionnaireSection {
  currentGate: GateId;
  completedQuestionnaires: QuestionnaireSubmission[];
  canAddQuestionnaire: boolean;
}
```

### 6. Improved Gate Navigation Labels (Requirement 6)

#### Gate Label Mapping
```typescript
const GATE_LABELS: Record<GateId, string> = {
  'pre-contract': 'Pre-Contract: PDM Engagement',
  'gate-0': 'Gate 0: Onboarding Kickoff',
  'gate-1': 'Gate 1: Ready to Sell',
  'gate-2': 'Gate 2: Ready to Order',
  'gate-3': 'Gate 3: Ready to Deliver',
  'post-launch': 'Post-Launch'
};
```

### 7. Questionnaire Submission Editing (Requirement 7)

#### Updated Questionnaire Page
```astro
// Existing pages support edit mode via query params:
// /questionnaires/gate-0-kickoff?partnerId=123&submissionId=456&mode=edit

interface QuestionnaireEditProps {
  gateId: GateId;
  submissionId: string;
  existingData: QuestionnaireSubmission;
  partnerId: string;
  mode: 'edit'; // vs 'view' or 'create'
}
```

#### Submission Update API
```typescript
// PUT /api/submission/[id]
interface SubmissionUpdateRequest {
  submissionId: string;
  data: Record<string, any>;
  signature?: Signature;
  updatedBy: string;
}

interface SubmissionUpdateResponse {
  success: boolean;
  submission: QuestionnaireSubmission;
  error?: string;
}
```

#### Partner Detail Questionnaire Display
```typescript
interface QuestionnaireListItem {
  submissionId: string;
  gateId: GateId;
  gateName: string;
  submittedAt: Date;
  updatedAt: Date;
  canEdit: boolean; // Based on user permissions
  editUrl: string; // Pre-computed edit URL
}

// Component to display on partner detail page
interface QuestionnaireHistoryProps {
  partnerId: string;
  submissions: QuestionnaireListItem[];
  currentUser: AuthUser;
}
```

#### Edit Permission Logic
```typescript
function canEditQuestionnaire(
  user: AuthUser | null,
  submission: QuestionnaireSubmission,
  partner: PartnerRecord
): boolean {
  if (!user) return false;
  
  // PDM (admin) can edit any questionnaire
  if (user.role === 'PDM') return true;
  
  // PAM can edit questionnaires for partners they own
  return partner.pamOwner?.toLowerCase() === user.email.toLowerCase();
}
```

### 8. Questionnaire Template Management (Requirement 8)

#### Template Data Model
```typescript
type FieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

interface QuestionField {
  id: string; // Unique identifier for the field
  type: FieldType;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  order: number; // For sorting
}

interface QuestionnaireTemplate {
  id: string; // e.g., 'pre-contract', 'gate-0', etc.
  name: string; // Display name
  version: number; // Incremented on each save
  fields: QuestionField[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // PDM email
}

interface TemplateVersion {
  templateId: string;
  version: number;
  fields: QuestionField[];
  createdAt: Date;
  createdBy: string;
}
```

#### Template Storage Structure
```typescript
// Storage keys:
// - templates/current/{templateId} -> QuestionnaireTemplate
// - templates/versions/{templateId}/{version} -> TemplateVersion
// - templates/metadata -> { lastUpdated: Date, templates: string[] }
```

#### Template Management Pages
```astro
// /admin/templates/index.astro - List all templates
interface TemplateListProps {
  templates: QuestionnaireTemplate[];
  currentUser: AuthUser;
}

// /admin/templates/[templateId]/edit.astro - Edit specific template
interface TemplateEditorProps {
  template: QuestionnaireTemplate;
  currentUser: AuthUser;
}

// /admin/templates/[templateId]/preview.astro - Preview template
interface TemplatePreviewProps {
  template: QuestionnaireTemplate;
}
```

#### Template Editor Component
```typescript
interface TemplateEditorComponentProps {
  template: QuestionnaireTemplate;
  onSave: (updatedTemplate: QuestionnaireTemplate) => Promise<void>;
  onCancel: () => void;
}

interface FieldEditorProps {
  field: QuestionField;
  onChange: (updatedField: QuestionField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}
```

#### Template API Endpoints
```typescript
// GET /api/templates - List all templates
interface TemplateListResponse {
  success: boolean;
  templates: QuestionnaireTemplate[];
  error?: string;
}

// GET /api/templates/[id] - Get specific template
interface TemplateResponse {
  success: boolean;
  template: QuestionnaireTemplate;
  error?: string;
}

// PUT /api/templates/[id] - Update template
interface TemplateUpdateRequest {
  fields: QuestionField[];
  updatedBy: string;
}

interface TemplateUpdateResponse {
  success: boolean;
  template: QuestionnaireTemplate;
  previousVersion: number;
  error?: string;
}

// GET /api/templates/[id]/versions - Get template version history
interface TemplateVersionsResponse {
  success: boolean;
  versions: TemplateVersion[];
  error?: string;
}

// GET /api/templates/[id]/versions/[version] - Get specific version
interface TemplateVersionResponse {
  success: boolean;
  version: TemplateVersion;
  error?: string;
}
```

#### Template Rendering Logic
```typescript
// When rendering a questionnaire, determine which template version to use
function getTemplateForSubmission(
  templateId: string,
  submission?: QuestionnaireSubmission
): Promise<QuestionnaireTemplate | TemplateVersion> {
  if (submission && submission.templateVersion) {
    // Viewing/editing existing submission - use version from submission time
    return getTemplateVersion(templateId, submission.templateVersion);
  } else {
    // New submission - use current template
    return getCurrentTemplate(templateId);
  }
}

// Store template version with submission
interface QuestionnaireSubmission {
  // ... existing fields ...
  templateVersion: number; // Version of template used for this submission
}
```

#### Template Validation
```typescript
function validateTemplate(template: QuestionnaireTemplate): ValidationResult {
  const errors: string[] = [];
  
  // Check for duplicate field IDs
  const fieldIds = template.fields.map(f => f.id);
  if (new Set(fieldIds).size !== fieldIds.length) {
    errors.push('Duplicate field IDs found');
  }
  
  // Check for empty labels
  if (template.fields.some(f => !f.label.trim())) {
    errors.push('All fields must have labels');
  }
  
  // Check options for select/radio/checkbox
  template.fields.forEach(field => {
    if (['select', 'radio', 'checkbox'].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push(`Field "${field.label}" requires options`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Data Models

### Extended Partner Record
No changes to core PartnerRecord structure needed. All features work with existing data model.

### New: User List Cache
```typescript
interface UserCache {
  users: Array<{
    email: string;
    name: string;
    role: 'PAM' | 'PDM';
  }>;
  lastUpdated: Date;
  expiresAt: Date;
}
```

### Extended: Questionnaire Submission
```typescript
interface QuestionnaireSubmission {
  // ... existing fields ...
  templateVersion: number; // Version of template used for this submission
}
```

### New: Questionnaire Templates
Templates are stored in Netlify Blobs with versioning:
- Current templates: `templates/current/{templateId}`
- Version history: `templates/versions/{templateId}/{version}`
- Metadata: `templates/metadata`

Each template update creates a new version while preserving the old version for historical submissions.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: PAM Dropdown Population
*For any* set of users with mixed roles, the PAM owner dropdown should contain exactly those users with the PAM role and no others.
**Validates: Requirements 1.2**

### Property 2: PAM Owner Update
*For any* partner record and any valid PAM email, updating the PAM owner and saving should result in the partner record having the new PAM owner email.
**Validates: Requirements 1.3**

### Property 3: PAM Owner Persistence
*For any* partner with an updated PAM owner, saving then retrieving the partner should return the same PAM owner email.
**Validates: Requirements 1.4**

### Property 4: Gate Metrics Calculation
*For any* set of partners, the sum of partner counts across all gate metrics should equal the total number of partners.
**Validates: Requirements 2.2**

### Property 5: Report Data Completeness
*For any* generated report, all required fields (partner count, completion rate, timeline metrics) should be present for each gate.
**Validates: Requirements 2.4**

### Property 6: PDM Utilization by Revenue
*For any* set of partners assigned to a PDM, the revenue-based utilization should equal the sum of all partner CCV values.
**Validates: Requirements 3.2**

### Property 7: PDM Utilization by Count
*For any* set of partners assigned to a PDM, the count-based utilization should equal the number of partners.
**Validates: Requirements 3.3**

### Property 8: Utilization Display Completeness
*For any* utilization calculation, the displayed output should contain both current value and capacity target.
**Validates: Requirements 3.4**

### Property 9: Documentation Search Results
*For any* search query and documentation content, all returned results should contain the search term (case-insensitive).
**Validates: Requirements 4.2**

### Property 10: Documentation Link Targets
*For any* contextual help link, the href attribute should match the expected documentation section URL.
**Validates: Requirements 4.4**

### Property 11: Gate View Filtering
*For any* gate and set of partners, the gate view should display only partners where currentGate matches the selected gate.
**Validates: Requirements 5.1**

### Property 12: Questionnaire Button Display
*For any* partner detail page, the "Add Gate Questionnaire" button text should include the partner's current gate name.
**Validates: Requirements 5.2**

### Property 13: Questionnaire Navigation
*For any* partner, clicking "Add Gate Questionnaire" should navigate to a URL containing the partner's ID as a query parameter.
**Validates: Requirements 5.3**

### Property 14: Partner Questionnaire Display
*For any* partner with completed questionnaires, all questionnaire submissions should appear in the partner detail view.
**Validates: Requirements 5.5**

### Property 15: Gate Label Format
*For any* gate navigation button, the displayed text should contain both the gate identifier and descriptive name.
**Validates: Requirements 6.1**

### Property 16: Questionnaire Edit Button Display
*For any* partner with completed questionnaires, each questionnaire in the list should have an associated "Edit" button.
**Validates: Requirements 7.1**

### Property 17: Questionnaire Pre-population
*For any* questionnaire loaded in edit mode, all form fields should be pre-populated with values from the existing submission.
**Validates: Requirements 7.3**

### Property 18: Questionnaire Update (Not Create)
*For any* edited questionnaire submission, saving should update the existing submission record and not create a new submission with a different ID.
**Validates: Requirements 7.5**

### Property 19: Questionnaire Update Timestamp
*For any* edited questionnaire, the updatedAt timestamp should be more recent than the original createdAt timestamp.
**Validates: Requirements 7.6**

### Property 20: Questionnaire History Display
*For any* partner with questionnaire submissions, the partner detail page should display all submissions with their last updated dates.
**Validates: Requirements 7.7**

### Property 21: Template Editor Field Display
*For any* questionnaire template, the template editor should display all fields from that template.
**Validates: Requirements 8.3**

### Property 22: Field Type Support
*For any* supported field type (text, textarea, select, radio, checkbox, date), the system should allow creating a field of that type.
**Validates: Requirements 8.4**

### Property 23: Field Reordering
*For any* template with multiple fields, reordering two fields should result in their order values being swapped correctly.
**Validates: Requirements 8.5**

### Property 24: Field Removal
*For any* template with fields, removing a field should result in that field no longer being present in the template's field list.
**Validates: Requirements 8.6**

### Property 25: Field Property Updates
*For any* field and any new property values (label, helpText, required), updating those properties should result in the field having the new values.
**Validates: Requirements 8.7**

### Property 26: Option-Based Field Options
*For any* field with type select, radio, or checkbox, the field should have a non-empty options array.
**Validates: Requirements 8.8**

### Property 27: Template Version Increment
*For any* template, saving an updated version should result in the version number being incremented by exactly 1.
**Validates: Requirements 8.9**

### Property 28: New Submissions Use Current Template
*For any* new questionnaire submission created after a template update, the submission should reference the latest template version.
**Validates: Requirements 8.10**

### Property 29: Historical Submission Template Preservation
*For any* existing submission, the template version stored with that submission should remain unchanged when the template is updated.
**Validates: Requirements 8.10, 8.11**

### Property 30: Preview Rendering Consistency
*For any* template, the preview rendering should generate the same field structure as the actual questionnaire form.
**Validates: Requirements 8.12**

### Property 31: Removed Field Exclusion
*For any* field removed from a template, new submissions should not include that field in the form, while existing submissions should retain the field data.
**Validates: Requirements 8.13**

## Error Handling

### PAM Reassignment Errors
- **No PAM users found**: Display message "No PAM users available. Contact administrator."
- **Save failure**: Display toast error "Failed to update PAM owner. Please try again."
- **Network error**: Retry with exponential backoff, show error after 3 attempts

### Reports Errors
- **No data available**: Display empty state with message "No partners to report on yet."
- **Calculation error**: Log error, display partial data with warning
- **Storage error**: Display error message "Unable to load report data. Please refresh."

### PDM Utilization Errors
- **Invalid capacity target**: Default to 10 partners or $10M revenue
- **Missing partner data**: Exclude from calculation, log warning
- **Division by zero**: Display "N/A" for utilization percentage

### Documentation Errors
- **Search failure**: Display message "Search unavailable. Please try again."
- **Broken links**: Log error, display 404 page with back link
- **Missing content**: Display placeholder with "Content coming soon"

### Navigation Errors
- **Invalid gate ID**: Redirect to dashboard with error message
- **Missing partner ID**: Display error "Partner not found"
- **Permission denied**: Redirect to dashboard with "Access denied" message

### Questionnaire Editing Errors
- **Submission not found**: Display error "Questionnaire submission not found" and redirect to partner page
- **Permission denied**: Display error "You don't have permission to edit this questionnaire"
- **Save failure**: Display toast error "Failed to save changes. Please try again."
- **Concurrent edit conflict**: Display warning "This questionnaire was modified by another user. Please refresh."
- **Invalid data**: Display field-level validation errors

### Template Management Errors
- **Permission denied**: Only PDM users can access template management - redirect others to dashboard
- **Template not found**: Display error "Template not found" with back link
- **Validation errors**: Display inline errors for invalid template configuration (duplicate IDs, missing labels, missing options)
- **Save failure**: Display toast error "Failed to save template. Please try again."
- **Version conflict**: Display warning "Template was modified by another user. Please refresh."
- **Missing template version**: Fall back to current template if historical version not found, log warning

## Testing Strategy

### Unit Tests
- PAM dropdown population logic
- Report calculation functions
- Utilization calculation functions
- Gate label mapping
- URL parameter handling

### Property-Based Tests
- Use **fast-check** (JavaScript/TypeScript property testing library)
- Configure each property test to run minimum 100 iterations
- Tag each test with format: `**Feature: hub-improvements, Property {number}: {property_text}**`

**Property tests to implement:**
1. PAM dropdown filtering (Property 1)
2. PAM owner updates (Property 2)
3. PAM owner persistence (Property 3)
4. Gate metrics totals (Property 4)
5. Report completeness (Property 5)
6. Revenue utilization calculation (Property 6)
7. Count utilization calculation (Property 7)
8. Utilization display (Property 8)
9. Search result relevance (Property 9)
10. Link target correctness (Property 10)
11. Gate view filtering (Property 11)
12. Questionnaire button text (Property 12)
13. Navigation URLs (Property 13)
14. Questionnaire display (Property 14)
15. Gate label format (Property 15)
16. Questionnaire edit button display (Property 16)
17. Questionnaire pre-population (Property 17)
18. Questionnaire update not create (Property 18)
19. Questionnaire update timestamp (Property 19)
20. Questionnaire history display (Property 20)
21. Template editor field display (Property 21)
22. Field type support (Property 22)
23. Field reordering (Property 23)
24. Field removal (Property 24)
25. Field property updates (Property 25)
26. Option-based field options (Property 26)
27. Template version increment (Property 27)
28. New submissions use current template (Property 28)
29. Historical submission template preservation (Property 29)
30. Preview rendering consistency (Property 30)
31. Removed field exclusion (Property 31)

### Integration Tests
- End-to-end PAM reassignment flow
- Report generation and display
- Partner-to-questionnaire navigation flow
- Gate view filtering and navigation
- Complete template management workflow (create field → reorder → save → version)
- Template versioning with submissions (create submission → update template → verify old submission uses old version)
- Questionnaire rendering with different template versions

## Implementation Phases

### Phase 0: Foundation (Prerequisite)
**Estimated: 1-2 hours**
1. Role consolidation (remove TPM and Admin roles)

### Phase 1: Quick Wins (High Priority)
**Estimated: 3-4 hours**
2. Gate navigation labels (Requirement 6)
3. PAM reassignment dropdown (Requirement 1)
4. Questionnaire submission editing (Requirement 7)

### Phase 2: Core Functionality (Medium Priority)
**Estimated: 8-12 hours**
5. Questionnaire template management (Requirement 8)
6. Partner-centric questionnaire flow (Requirement 5)
7. Reports population (Requirement 2)

### Phase 3: Advanced Features (Low Priority)
**Estimated: 3-4 hours**
8. PDM utilization tracking (Requirement 3)
9. Documentation improvements (Requirement 4) - if needed

## Security Considerations

- **PAM user list**: Only expose to authenticated PDM users
- **Utilization data**: Only show PDM their own utilization (unless admin)
- **Partner data**: Maintain existing RBAC rules
- **API endpoints**: Require authentication, validate permissions

## Performance Considerations

- **User list caching**: Cache PAM user list for 5 minutes to reduce Auth0 API calls
- **Report calculation**: Calculate on-demand, consider caching for 1 hour
- **Gate views**: Use existing partner filtering, no additional queries needed
- **Documentation search**: Client-side search for small docs, consider server-side for large content
- **Template caching**: Cache current templates in memory for 5 minutes to reduce blob storage reads
- **Template versions**: Only load historical versions when viewing old submissions
- **Template validation**: Perform client-side validation before API calls to reduce round trips

## Deployment Strategy

1. Deploy Phase 1 (quick wins) first for immediate user value
2. Gather feedback before implementing Phase 2
3. Phase 3 can be deployed independently as features are completed
4. All changes are backward compatible - no data migration needed

## Rollback Plan

- All features are additive - can be disabled via feature flags if needed
- No database schema changes - safe to rollback code
- Gate label changes are cosmetic - no functional impact if reverted
