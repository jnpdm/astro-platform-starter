# Design Document

## Overview

The Partner Onboarding Hub is an internal platform for Kuiper sales teams (PAMs, PDMs, TPMs, PSMs, TAMs) to manage the structured partner onboarding journey from pre-contract engagement through post-launch operations. The hub implements the gated onboarding process with three critical readiness gates (Ready to Sell, Ready to Order, Ready to Deliver) and tracks 79 discrete tasks across six key phases.

Built on Astro with server-side rendering, the hub provides questionnaire-based assessments at each gate, tracks partner progress through the 120-day onboarding journey, captures digital signatures for gate approvals, and serves as a centralized documentation resource. The system enforces the gated progression model where partners cannot advance without meeting all criteria, ensuring efficient resource allocation and preventing waste on unprepared partners.

The architecture follows a hub-and-spoke model where a central dashboard provides access to gate-specific questionnaires, progress tracking, and documentation organized by onboarding phase. The system maintains the existing Astro/Tailwind foundation while introducing new components for questionnaire management, signature capture, and status tracking.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │ Questionnaire│  │   Reports    │  │
│  │    Page      │  │    Pages     │  │    Page      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Astro SSR Layer (Netlify)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Page       │  │  API Routes  │  │  Middleware  │  │
│  │ Components   │  │              │  │   (Auth)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Netlify Blobs│  │ Questionnaire│  │ Documentation│  │
│  │  (Storage)   │  │   Configs    │  │    Links     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Astro 5.x with SSR enabled
- **UI Components**: React 19.x for interactive forms
- **Styling**: Tailwind CSS 4.x
- **Data Storage**: Netlify Blobs for questionnaire submissions and partner progress
- **Authentication**: Netlify Identity for internal team access
- **API Layer**: Astro API routes
- **Deployment**: Netlify platform

## Components and Interfaces

### 1. Dashboard Component

**Location**: `src/pages/index.astro`

**Purpose**: Main landing page displaying all available questionnaires and their status

**Interface**:
```typescript
interface DashboardProps {
  partners: PartnerProgress[];
  gates: GateMetadata[];
  recentActivity: ActivityItem[];
  documentationSections: DocumentationSection[];
}

interface PartnerProgress {
  partnerId: string;
  partnerName: string;
  pamOwner: string;
  pdmOwner?: string;
  contractSignedDate?: Date;
  currentGate: 'pre-contract' | 'gate-0' | 'gate-1' | 'gate-2' | 'gate-3' | 'post-launch';
  gateStatuses: Record<string, GateStatus>;
  launchDate?: Date;
  tier: 'tier-0' | 'tier-1' | 'tier-2';
  ccv: number; // Contractually Committed Value
}

interface GateMetadata {
  id: string;
  name: string;
  description: string;
  questionnaires: QuestionnaireMetadata[];
  phases: PhaseMetadata[];
  estimatedWeeks: string;
  criteria: string[];
}

interface QuestionnaireMetadata {
  id: string;
  name: string;
  description: string;
  gate: string;
  sections: number;
  estimatedTime: number;
  requiredFor: string[]; // roles that must complete
}

interface GateStatus {
  status: 'not-started' | 'in-progress' | 'passed' | 'failed';
  completedDate?: Date;
  approvedBy?: string;
  signature?: Signature;
}
```

**Features**:
- Partner progress overview with current gate status
- Gate-based navigation (Pre-Contract, Gate 0-3, Post-Launch)
- Quick stats (partners by gate, completion rates, upcoming launches)
- Recent activity feed showing gate completions and questionnaire submissions
- Documentation organized by onboarding phase
- Role-based view filtering (PAM, PDM, TPM, PSM, TAM)

### 2. Questionnaire Form Component

**Location**: `src/components/questionnaires/QuestionnaireForm.tsx`

**Purpose**: Dynamic form renderer for any questionnaire structure

**Interface**:
```typescript
interface QuestionnaireFormProps {
  config: QuestionnaireConfig;
  existingData?: SubmissionData;
  mode: 'edit' | 'view';
  onSubmit: (data: SubmissionData) => Promise<void>;
}

interface QuestionnaireConfig {
  id: string;
  title: string;
  sections: Section[];
  requiredFields: string[];
}

interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  passFailCriteria?: PassFailCriteria;
  documentationLinks?: DocumentationLink[];
}

interface Field {
  id: string;
  type: 'text' | 'email' | 'date' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule;
  helpText?: string;
}

interface PassFailCriteria {
  type: 'manual' | 'automatic';
  rules?: AutomaticRule[];
}
```

**Features**:
- Dynamic field rendering based on configuration
- Real-time validation
- Section-by-section navigation
- Progress indicator
- Auto-save to local storage
- Contextual help tooltips

### 3. Section Status Component

**Location**: `src/components/questionnaires/SectionStatus.tsx`

**Purpose**: Display pass/fail status for questionnaire sections

**Interface**:
```typescript
interface SectionStatusProps {
  sectionId: string;
  status: 'pass' | 'fail' | 'pending';
  mode: 'compact' | 'detailed';
  failureReasons?: string[];
}
```

**Visual Design**:
- Pass: Green checkmark icon with "PASS" label
- Fail: Red X icon with "FAIL" label and expandable reasons
- Pending: Yellow clock icon with "PENDING" label
- Compact mode: Icon only
- Detailed mode: Icon + label + reasons

### 4. Signature Capture Component

**Location**: `src/components/questionnaires/SignatureCapture.tsx`

**Purpose**: Capture digital signatures before submission

**Interface**:
```typescript
interface SignatureCaptureProps {
  onSignature: (signature: Signature) => void;
  mode: 'typed' | 'drawn';
}

interface Signature {
  type: 'typed' | 'drawn';
  data: string; // base64 for drawn, plain text for typed
  signerName: string;
  signerEmail: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

**Features**:
- Two signature modes: typed name or canvas drawing
- Signature preview
- Terms acceptance checkbox
- Metadata capture (timestamp, IP, user agent)

### 5. Gate Questionnaires

**Pre-Contract PDM Engagement Questionnaire**

**Location**: `src/pages/questionnaires/pre-contract-pdm.astro`

**Purpose**: Validates qualification criteria for PDM support before contract signature

**Sections**:
1. Executive Sponsorship Confirmed
2. Commercial Framework Alignment
3. Technical Feasibility / Partner Operational Questions
4. Near-Term Closure Timeline
5. Strategic Partner Classification

**Gate 0: Onboarding Kickoff Questionnaire**

**Location**: `src/pages/questionnaires/gate-0-kickoff.astro`

**Purpose**: Validates readiness for white-glove onboarding support

**Sections**:
1. Contract Execution Complete
2. Partner Team Identified and Committed
3. Launch Timing Within 12 Months
4. Financial Bar for White-Glove Onboarding
5. Strategic Value Assessment
6. Operational Readiness Indicators

**Gate 1: Ready to Sell Questionnaire**

**Location**: `src/pages/questionnaires/gate-1-ready-to-sell.astro`

**Purpose**: Validates completion of onboarding kickoff, GTM strategy, and training

**Sections**:
1. Phase 1A: Onboarding Kickoff & Planning (Weeks 1-3)
2. Phase 1B: GTM Strategy & Technical Discovery (Weeks 3-6)
3. Phase 1C: Training & Enablement (Weeks 7-12)

**Gate 2: Ready to Order Questionnaire**

**Location**: `src/pages/questionnaires/gate-2-ready-to-order.astro`

**Purpose**: Validates systems integration and operational process setup

**Sections**:
1. Phase 2A: Systems Integration & API Implementation (Weeks 13-17)
2. Phase 2B: Operational Process Setup (Weeks 13-17)

**Gate 3: Ready to Deliver Questionnaire**

**Location**: `src/pages/questionnaires/gate-3-ready-to-deliver.astro`

**Purpose**: Validates operational readiness and launch validation

**Sections**:
1. Phase 3A: Operational Readiness (Weeks 18-19)
2. Phase 3B: Launch Validation (Week 20)

### 6. Documentation Hub Component

**Location**: `src/components/documentation/DocumentationHub.tsx`

**Purpose**: Centralized documentation access organized by onboarding phase and role

**Interface**:
```typescript
interface DocumentationHubProps {
  sections: DocumentationSection[];
  contextual?: boolean;
  currentGate?: string;
  userRole?: 'PAM' | 'PDM' | 'TPM' | 'PSM' | 'TAM';
}

interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  gate: string; // pre-contract, gate-0, gate-1, gate-2, gate-3, post-launch
  phase?: string; // 1A, 1B, 1C, 2A, 2B, 3A, 3B
  links: DocumentationLink[];
  relevantRoles: string[];
}

interface DocumentationLink {
  title: string;
  url: string;
  type: 'internal' | 'external';
  icon?: string;
  description?: string;
}
```

**Documentation Categories**:
- Pre-Contract Engagement Guidelines
- Gate 0: Kickoff Requirements
- Gate 1: Sales & Training Resources
- Gate 2: Integration & API Documentation
- Gate 3: Launch Readiness Checklists
- Post-Launch: Ongoing Operations
- Role-Specific Guides (PAM, PDM, TPM, PSM, TAM)

## Data Models

### Partner Progress Model

```typescript
interface PartnerRecord {
  id: string;
  partnerName: string;
  
  // Team Assignments
  pamOwner: string;
  pdmOwner?: string;
  tpmOwner?: string;
  psmOwner?: string;
  tamOwner?: string;
  
  // Contract Information
  contractSignedDate?: Date;
  contractType: 'PPA' | 'Distribution' | 'Sales-Agent' | 'Other';
  tier: 'tier-0' | 'tier-1' | 'tier-2';
  ccv: number; // Contractually Committed Value
  lrp: number; // Launch Revenue Potential
  
  // Timeline
  targetLaunchDate?: Date;
  actualLaunchDate?: Date;
  onboardingStartDate?: Date;
  
  // Gate Progress
  currentGate: 'pre-contract' | 'gate-0' | 'gate-1' | 'gate-2' | 'gate-3' | 'post-launch';
  gates: Record<string, GateProgress>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface GateProgress {
  gateId: string;
  status: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'blocked';
  startedDate?: Date;
  completedDate?: Date;
  questionnaires: Record<string, QuestionnaireSubmission>;
  approvals: Approval[];
  blockers?: string[];
}

interface QuestionnaireSubmission {
  id: string;
  questionnaireId: string;
  version: string;
  
  // Form Data
  sections: SectionData[];
  
  // Status Tracking
  sectionStatuses: Record<string, SectionStatus>;
  overallStatus: 'pass' | 'fail' | 'partial';
  
  // Signature
  signature: Signature;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  submittedBy: string;
  submittedByRole: 'PAM' | 'PDM' | 'TPM' | 'PSM' | 'TAM';
  ipAddress: string;
}

interface SectionData {
  sectionId: string;
  fields: Record<string, any>;
  status: SectionStatus;
}

interface SectionStatus {
  result: 'pass' | 'fail' | 'pending';
  evaluatedAt?: Date;
  evaluatedBy?: string;
  notes?: string;
  failureReasons?: string[];
}

interface Approval {
  approvedBy: string;
  approvedByRole: string;
  approvedAt: Date;
  signature: Signature;
  notes?: string;
}
```

### Questionnaire Configuration Model

```typescript
interface QuestionnaireConfigFile {
  id: string;
  version: string;
  metadata: {
    name: string;
    description: string;
    gate: string;
    phase?: string;
    estimatedTime: number;
    icon?: string;
    requiredRoles: string[]; // roles that must complete this questionnaire
    primaryRole: string; // role that leads completion
  };
  sections: Section[];
  validation: ValidationConfig;
  documentation: DocumentationLink[];
  gateCriteria: string[]; // criteria this questionnaire validates
}
```

**Storage Location**: `src/config/questionnaires/`

**Available Questionnaires**:
- `pre-contract-pdm.json` - Pre-Contract PDM Engagement
- `gate-0-kickoff.json` - Onboarding Kickoff
- `gate-1-ready-to-sell.json` - Ready to Sell
- `gate-2-ready-to-order.json` - Ready to Order
- `gate-3-ready-to-deliver.json` - Ready to Deliver

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**
   - Display inline error messages below fields
   - Highlight invalid fields with red border
   - Prevent submission until resolved
   - Show summary of errors at top of form

2. **Network Errors**
   - Retry mechanism for failed API calls (3 attempts)
   - Display user-friendly error messages
   - Preserve form data in local storage
   - Offer manual retry option

3. **Storage Errors**
   - Graceful degradation if Blobs unavailable
   - Local storage fallback for draft saves
   - Clear error messaging to user
   - Admin notification for persistent issues

### Server-Side Error Handling

1. **API Route Errors**
   - Structured error responses with codes
   - Logging to Netlify Functions logs
   - Rate limiting protection
   - Input validation before processing

2. **Data Storage Errors**
   - Transaction rollback on failure
   - Retry logic for transient failures
   - Data integrity checks
   - Backup mechanism for critical data

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Coverage Areas**:
- Form validation logic
- Data transformation utilities
- Status calculation functions
- Signature generation and validation

**Example Test Cases**:
```typescript
describe('SectionStatus', () => {
  test('calculates pass status when all criteria met', () => {
    // Test implementation
  });
  
  test('calculates fail status when criteria not met', () => {
    // Test implementation
  });
});
```

### Integration Testing

**Framework**: Playwright

**Coverage Areas**:
- Complete questionnaire submission flow
- Signature capture and storage
- Data persistence to Netlify Blobs
- Dashboard data loading

**Example Test Cases**:
```typescript
test('complete pre-contract questionnaire submission', async ({ page }) => {
  await page.goto('/questionnaires/pre-contract');
  // Fill form
  // Sign
  // Submit
  // Verify storage
});
```

### End-to-End Testing

**Scenarios**:
1. New user completes first questionnaire
2. User returns to view previous submission
3. User completes multiple questionnaires in sequence
4. Admin views reports and analytics
5. Error recovery scenarios

### Manual Testing Checklist

- [ ] All questionnaire fields render correctly
- [ ] Validation works for all field types
- [ ] Signature capture works in both modes
- [ ] Data persists correctly to Netlify Blobs
- [ ] Pass/fail status displays accurately
- [ ] Documentation links work
- [ ] Responsive design on tablet and desktop
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)

## Security Considerations

### Authentication

- Implement Netlify Identity for user authentication
- Require login before accessing any questionnaire
- Session management with secure cookies
- Automatic logout after inactivity

### Data Protection

- Encrypt sensitive data at rest in Netlify Blobs
- Use HTTPS for all communications
- Sanitize all user inputs to prevent XSS
- Implement CSRF protection on forms

### Access Control

- Role-based access (sales team, admin)
- Audit logging for all submissions
- IP address logging for signatures
- Rate limiting on API endpoints

### Compliance

- GDPR considerations for partner data
- Data retention policies
- Right to deletion implementation
- Audit trail for compliance

## Performance Optimization

### Frontend Optimization

- Code splitting for questionnaire components
- Lazy loading of non-critical components
- Image optimization for icons and logos
- Minimize bundle size (target < 200KB initial load)

### Backend Optimization

- Efficient Netlify Blobs queries with pagination
- Caching of questionnaire configurations
- Edge function deployment for low latency
- Optimize API response payloads

### Monitoring

- Netlify Analytics for page performance
- Custom metrics for form completion time
- Error tracking and alerting
- User session recording for UX insights

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

1. Clean up existing demo code (remove blob shapes, edge functions examples)
2. Set up new page structure for gate-based navigation
3. Create base components (Dashboard, Layout, Navigation)
4. Implement data models for partner progress and gate tracking
5. Set up Netlify Blobs storage structure

### Phase 2: Core Questionnaires (Week 3-4)

1. Build QuestionnaireForm component with section-based navigation
2. Implement signature capture component
3. Create Pre-Contract PDM Engagement questionnaire
4. Create Gate 0: Onboarding Kickoff questionnaire
5. Set up API routes for questionnaire submission and retrieval

### Phase 3: Gate Progression (Week 5-6)

1. Create Gate 1: Ready to Sell questionnaire
2. Create Gate 2: Ready to Order questionnaire
3. Create Gate 3: Ready to Deliver questionnaire
4. Implement gate status tracking and progression logic
5. Build partner progress dashboard

### Phase 4: Documentation & Enhancement (Week 7-8)

1. Add documentation hub organized by gate and phase
2. Implement role-based access and filtering
3. Build reports and analytics (partners by gate, completion rates)
4. Add authentication with Netlify Identity
5. Create role-specific views (PAM, PDM, TPM, PSM, TAM)

### Phase 5: Polish & Launch (Week 9-10)

1. Comprehensive testing across all gates
2. Performance optimization
3. User documentation and training materials
4. Deployment to production
5. Team training sessions

## Configuration Management

### Questionnaire Configuration Files

**Location**: `src/config/questionnaires/`

**Format**: JSON files for each questionnaire

**Example Structure**:
```json
{
  "id": "pre-contract-pdm",
  "version": "1.0.0",
  "metadata": {
    "name": "Pre-Contract PDM Engagement Checklist",
    "description": "Validates qualification criteria for PDM support before contract signature",
    "gate": "pre-contract",
    "estimatedTime": 30,
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
  "sections": [...]
}
```

### Documentation Links Configuration

**Location**: `src/config/documentation.json`

**Format**: JSON file with gate-organized links

**Example Structure**:
```json
{
  "sections": [
    {
      "id": "pre-contract",
      "title": "Pre-Contract Engagement",
      "description": "Resources for pre-contract PDM engagement",
      "gate": "pre-contract",
      "relevantRoles": ["PAM", "PDM"],
      "links": [
        {
          "title": "Executive Sponsorship Validation Guide",
          "url": "/docs/exec-sponsorship",
          "type": "internal",
          "description": "How to validate executive commitment"
        },
        {
          "title": "Commercial Framework Assessment",
          "url": "/docs/commercial-framework",
          "type": "internal",
          "description": "Evaluating partnership structure and revenue model"
        }
      ]
    },
    {
      "id": "gate-1-phase-1a",
      "title": "Gate 1: Onboarding Kickoff & Planning",
      "description": "Resources for Phase 1A (Weeks 1-3)",
      "gate": "gate-1",
      "phase": "1A",
      "relevantRoles": ["PDM", "PAM", "TPM"],
      "links": [
        {
          "title": "Onboarding Kickoff Session Template",
          "url": "/docs/kickoff-template",
          "type": "internal"
        },
        {
          "title": "Launch Timeline Creation Guide",
          "url": "/docs/launch-timeline",
          "type": "internal"
        }
      ]
    }
  ]
}
```

### Gate Configuration

**Location**: `src/config/gates.json`

**Format**: JSON file defining gate structure

**Example Structure**:
```json
{
  "gates": [
    {
      "id": "pre-contract",
      "name": "Pre-Contract PDM Engagement",
      "description": "Limited strategic technical support before contract signature",
      "questionnaires": ["pre-contract-pdm"],
      "estimatedWeeks": "Ongoing",
      "pdmHoursPerWeek": "10-15",
      "criteria": [
        "Executive Sponsorship Confirmed",
        "Commercial Framework Alignment",
        "Technical Questions Identified",
        "60-Day Closure Timeline",
        "Tier 0/1 Classification"
      ]
    },
    {
      "id": "gate-0",
      "name": "Gate 0: Onboarding Kickoff",
      "description": "Validates readiness for white-glove onboarding support",
      "questionnaires": ["gate-0-kickoff"],
      "estimatedWeeks": "Prerequisite",
      "criteria": [
        "Contract Execution Complete",
        "Partner Team Identified",
        "Launch Within 12 Months",
        "Financial Bar Met",
        "Strategic Value Validated",
        "Operational Readiness Confirmed"
      ]
    },
    {
      "id": "gate-1",
      "name": "Gate 1: Ready to Sell",
      "description": "Partner team trained and ready to sell Kuiper services",
      "questionnaires": ["gate-1-ready-to-sell"],
      "phases": ["1A", "1B", "1C"],
      "estimatedWeeks": "Weeks 1-12",
      "criteria": [
        "Project plan approved",
        "GTM strategy approved",
        "Technical architecture defined",
        "Sales team certified",
        "Product knowledge validated",
        "Portal access confirmed"
      ]
    }
  ]
}
```

### Environment Variables

```
NETLIFY_BLOBS_CONTEXT=production
NETLIFY_SITE_ID=<site-id>
AUTH_ENABLED=true
```

## Deployment Architecture

### Netlify Configuration

**File**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Build Process

1. Install dependencies
2. Build Astro site with SSR
3. Deploy to Netlify
4. Initialize Netlify Blobs stores
5. Verify deployment health

### Rollback Strategy

- Maintain previous deployment for instant rollback
- Database migration versioning
- Feature flags for gradual rollout
- Monitoring alerts for deployment issues
