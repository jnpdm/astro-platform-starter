# Questionnaire Components

This directory contains components for rendering and managing questionnaires in the Partner Onboarding Hub.

## Components

- **QuestionnaireForm**: Dynamic multi-section form component
- **SectionStatus**: Visual status indicator for questionnaire sections

---

# QuestionnaireForm Component

A dynamic, multi-section form component for rendering questionnaires with real-time validation, auto-save functionality, and progress tracking.

## Features

### ✅ Dynamic Field Rendering
Supports all required field types:
- **text**: Single-line text input
- **email**: Email input with format validation
- **date**: Date picker
- **number**: Numeric input with validation
- **select**: Dropdown selection
- **checkbox**: Multiple selection checkboxes
- **radio**: Single selection radio buttons
- **textarea**: Multi-line text input

### ✅ Real-time Validation
- Required field validation
- Type-specific validation (email format, number format, etc.)
- Custom validation rules:
  - `regex`: Pattern matching
  - `min`/`max`: Numeric range validation
  - `minLength`/`maxLength`: String length validation
  - `email`: Email format validation
  - `url`: URL format validation
- Inline error messages
- Field-level error highlighting

### ✅ Section-by-Section Navigation
- Progress indicator showing completion percentage
- Section navigation buttons
- Quick jump to any section via section tabs
- Visual indicators for sections with validation errors
- Smooth scrolling between sections

### ✅ Auto-save to localStorage
- Automatic draft preservation
- Saves form data and current section
- Restores data on page reload
- Clears saved data on successful submission
- Unique keys per questionnaire and partner

### ✅ View and Edit Modes
- **Edit mode**: Full interactivity with validation
- **View mode**: Read-only display of submitted data

### ✅ Accessibility
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Error announcements

## Usage

### Basic Example

```tsx
import QuestionnaireForm from '../../components/questionnaires/QuestionnaireForm';
import type { QuestionnaireConfig } from '../../types/questionnaire';

const config: QuestionnaireConfig = {
  id: 'my-questionnaire',
  version: '1.0.0',
  metadata: {
    name: 'My Questionnaire',
    description: 'A sample questionnaire',
    gate: 'gate-1',
    estimatedTime: 30,
    requiredRoles: ['PAM'],
    primaryRole: 'PAM',
  },
  sections: [
    {
      id: 'section-1',
      title: 'Basic Information',
      description: 'Please provide basic information',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
          helpText: 'Enter your full legal name',
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
        },
      ],
    },
  ],
  validation: {
    requiredFields: ['name', 'email'],
  },
  documentation: [],
  gateCriteria: [],
};

const handleSubmit = async (data) => {
  // Handle form submission
  console.log('Submitted data:', data);
};

<QuestionnaireForm
  config={config}
  mode="edit"
  onSubmit={handleSubmit}
  partnerId="partner-123"
/>
```

### With Existing Data

```tsx
const existingData = {
  sections: [
    {
      sectionId: 'section-1',
      fields: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      status: {
        result: 'pass',
      },
    },
  ],
};

<QuestionnaireForm
  config={config}
  existingData={existingData}
  mode="view"
  onSubmit={handleSubmit}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `QuestionnaireConfig` | Yes | Questionnaire configuration object |
| `mode` | `'edit' \| 'view'` | Yes | Form mode (editable or read-only) |
| `onSubmit` | `(data: SubmissionData) => Promise<void>` | Yes | Callback function for form submission |
| `existingData` | `SubmissionData` | No | Pre-populated form data |
| `partnerId` | `string` | No | Partner ID for auto-save key generation |

## Field Configuration

### Text Field
```json
{
  "id": "field-id",
  "type": "text",
  "label": "Field Label",
  "required": true,
  "placeholder": "Enter text...",
  "helpText": "Additional help text",
  "validation": {
    "type": "minLength",
    "value": 5,
    "message": "Must be at least 5 characters"
  }
}
```

### Email Field
```json
{
  "id": "email-field",
  "type": "email",
  "label": "Email Address",
  "required": true,
  "helpText": "We'll never share your email"
}
```

### Select Field
```json
{
  "id": "select-field",
  "type": "select",
  "label": "Choose an option",
  "required": true,
  "options": ["Option 1", "Option 2", "Option 3"]
}
```

### Radio Field
```json
{
  "id": "radio-field",
  "type": "radio",
  "label": "Select one",
  "required": true,
  "options": ["Yes", "No"]
}
```

### Checkbox Field
```json
{
  "id": "checkbox-field",
  "type": "checkbox",
  "label": "Select multiple",
  "required": false,
  "options": ["Option A", "Option B", "Option C"]
}
```

### Number Field
```json
{
  "id": "number-field",
  "type": "number",
  "label": "Enter a number",
  "required": true,
  "validation": {
    "type": "min",
    "value": 0,
    "message": "Must be positive"
  }
}
```

### Date Field
```json
{
  "id": "date-field",
  "type": "date",
  "label": "Select a date",
  "required": true
}
```

### Textarea Field
```json
{
  "id": "textarea-field",
  "type": "textarea",
  "label": "Enter detailed information",
  "required": true,
  "placeholder": "Type here...",
  "helpText": "Provide as much detail as possible"
}
```

## Validation Rules

### Built-in Validation
- **Required**: Validates that field has a value
- **Email**: Validates email format
- **Number**: Validates numeric input

### Custom Validation Rules

#### Regex
```json
{
  "type": "regex",
  "value": "^[A-Z]{2}\\d{4}$",
  "message": "Must be 2 letters followed by 4 digits"
}
```

#### Min/Max (Numbers)
```json
{
  "type": "min",
  "value": 10,
  "message": "Must be at least 10"
}
```

#### MinLength/MaxLength (Strings)
```json
{
  "type": "maxLength",
  "value": 100,
  "message": "Must be 100 characters or less"
}
```

#### URL
```json
{
  "type": "url",
  "message": "Must be a valid URL"
}
```

## Auto-save Behavior

The component automatically saves form data to localStorage:

- **Save trigger**: On every field change
- **Save key format**: `questionnaire-draft-{questionnaireId}-{partnerId}`
- **Saved data includes**:
  - All form field values
  - Current section index
  - Timestamp
- **Restoration**: Automatic on component mount (if no existing data provided)
- **Cleanup**: Automatic on successful submission

### Manually clearing auto-saved data

```javascript
const autoSaveKey = `questionnaire-draft-${questionnaireId}-${partnerId}`;
localStorage.removeItem(autoSaveKey);
```

## Submission Data Format

The component returns data in the following format:

```typescript
{
  sections: [
    {
      sectionId: 'section-1',
      fields: {
        'field-id-1': 'value1',
        'field-id-2': 'value2',
      },
      status: {
        result: 'pending',
      },
    },
  ],
  metadata: {
    partnerId: 'partner-123',
  },
}
```

## Styling

The component uses Tailwind CSS classes. Key styling features:

- Responsive design (mobile-friendly)
- Consistent spacing and typography
- Color-coded validation states:
  - Red: Errors
  - Blue: Active/Focus states
  - Green: Success (submit button)
  - Gray: Disabled/View mode
- Smooth transitions and animations

## Testing

Unit tests are provided in `QuestionnaireForm.test.tsx`:

```bash
npm test src/components/questionnaires/QuestionnaireForm.test.tsx
```

Test coverage includes:
- Field validation logic
- Progress calculation
- Section navigation
- Auto-save key generation
- Field type support
- Validation rules

## Demo

A demo page is available at `/questionnaires/demo` showing the component with the Pre-Contract PDM questionnaire.

## Requirements Satisfied

This component satisfies the following requirements:

- **Requirement 2.1**: Dynamic field rendering based on field type
- **Requirement 2.2**: Real-time validation for required fields and field-specific rules
- **Requirement 4.5**: Section-by-section navigation with progress indicator
- **Requirement 8.4**: Auto-save to localStorage for draft preservation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatible
- Proper ARIA labels and roles
- Focus management
- Error announcements

## Performance

- Optimized re-renders with React hooks
- Debounced auto-save (via useEffect)
- Minimal bundle size
- Lazy validation (on blur/submit)

## Future Enhancements

Potential improvements for future iterations:

- [ ] Conditional field visibility based on other field values
- [ ] File upload field type
- [ ] Rich text editor for textarea fields
- [ ] Multi-language support
- [ ] Custom field components
- [ ] Field dependencies and calculations
- [ ] Progress persistence across sessions
- [ ] Offline support with service workers


---

# SectionStatus Component

A visual indicator component that displays pass/fail/pending status for questionnaire sections with color-coded icons and optional failure reasons.

## Features

### ✅ Visual Status Indicators
- **Pass**: Green checkmark icon (✓)
- **Fail**: Red X icon (✗)
- **Pending**: Yellow clock icon (🕐)

### ✅ Display Modes
- **Compact mode**: Icon only (for space-constrained layouts)
- **Detailed mode**: Icon + label + failure reasons + notes

### ✅ Failure Reason Display
- Shows specific reasons when a section fails
- Supports multiple failure reasons
- Only displayed for fail status

### ✅ Accessibility
- Proper ARIA labels for screen readers
- Tooltips in compact mode
- Semantic HTML structure

## Usage

### Basic Example - Pass Status

```tsx
import { SectionStatus } from '../../components/questionnaires/SectionStatus';
import type { SectionStatus as SectionStatusType } from '../../types/submission';

const status: SectionStatusType = {
  result: 'pass',
};

<SectionStatus
  sectionId="executive-sponsorship"
  status={status}
  mode="detailed"
/>
```

### Fail Status with Reasons

```tsx
const status: SectionStatusType = {
  result: 'fail',
  failureReasons: [
    'Missing executive sponsorship confirmation',
    'CCV below strategic threshold (< 10% of Country LRP)',
  ],
};

<SectionStatus
  sectionId="strategic-classification"
  status={status}
  mode="detailed"
/>
```

### Pending Status

```tsx
const status: SectionStatusType = {
  result: 'pending',
};

<SectionStatus
  sectionId="commercial-framework"
  status={status}
  mode="detailed"
/>
```

### Compact Mode

```tsx
const status: SectionStatusType = {
  result: 'pass',
};

<SectionStatus
  sectionId="technical-feasibility"
  status={status}
  mode="compact"
/>
```

### With Notes

```tsx
const status: SectionStatusType = {
  result: 'pass',
  notes: 'Approved by PDM team on 2025-01-15',
  evaluatedBy: 'pdm-user@example.com',
  evaluatedAt: new Date('2025-01-15T10:30:00Z'),
};

<SectionStatus
  sectionId="timeline"
  status={status}
  mode="detailed"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sectionId` | `string` | Yes | - | Unique identifier for the section |
| `status` | `SectionStatus` | Yes | - | Status object containing result and metadata |
| `mode` | `'compact' \| 'detailed'` | No | `'detailed'` | Display mode |
| `className` | `string` | No | `''` | Additional CSS classes |

## Status Object

```typescript
interface SectionStatus {
  result: 'pass' | 'fail' | 'pending';
  evaluatedAt?: Date;
  evaluatedBy?: string;
  notes?: string;
  failureReasons?: string[];
}
```

## Visual Design

### Pass Status (Detailed Mode)
```
┌─────────────────────┐
│ ✓ PASS              │
└─────────────────────┘
Green background (#f0fdf4)
Green text (#16a34a)
Green border (#bbf7d0)
```

### Fail Status (Detailed Mode)
```
┌─────────────────────────────────────────┐
│ ✗ FAIL                                  │
│                                         │
│ Reasons:                                │
│ • Missing executive sponsorship         │
│ • CCV below strategic threshold         │
└─────────────────────────────────────────┘
Red background (#fef2f2)
Red text (#dc2626)
Red border (#fecaca)
```

### Pending Status (Detailed Mode)
```
┌─────────────────────┐
│ 🕐 PENDING          │
└─────────────────────┘
Yellow background (#fefce8)
Yellow text (#ca8a04)
Yellow border (#fef08a)
```

### Compact Mode
```
✓  (pass - green)
✗  (fail - red)
🕐 (pending - yellow)
```

## Color Scheme

| Status | Background | Text | Border | Icon |
|--------|-----------|------|--------|------|
| Pass | `bg-green-50` | `text-green-600` | `border-green-200` | Green checkmark |
| Fail | `bg-red-50` | `text-red-600` | `border-red-200` | Red X |
| Pending | `bg-yellow-50` | `text-yellow-600` | `border-yellow-200` | Yellow clock |

## Use Cases

### 1. Questionnaire Summary View
Display overall status for each section after submission:

```tsx
{sections.map((section) => (
  <div key={section.id} className="flex items-center justify-between">
    <h3>{section.title}</h3>
    <SectionStatus
      sectionId={section.id}
      status={section.status}
      mode="compact"
    />
  </div>
))}
```

### 2. Detailed Section Review
Show detailed status with failure reasons for internal review:

```tsx
<div className="space-y-4">
  {sections.map((section) => (
    <div key={section.id} className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
      <SectionStatus
        sectionId={section.id}
        status={section.status}
        mode="detailed"
      />
    </div>
  ))}
</div>
```

### 3. Dashboard Status Indicators
Quick status overview on partner dashboard:

```tsx
<div className="grid grid-cols-5 gap-2">
  {sections.map((section) => (
    <div key={section.id} className="text-center">
      <SectionStatus
        sectionId={section.id}
        status={section.status}
        mode="compact"
      />
      <p className="text-xs mt-1">{section.title}</p>
    </div>
  ))}
</div>
```

## Accessibility Features

- **ARIA Labels**: Each status indicator has a descriptive aria-label
- **Tooltips**: Compact mode includes title attribute with full status
- **Icons**: Marked as `aria-hidden="true"` to avoid redundant announcements
- **Semantic HTML**: Uses proper heading and list structures
- **Color Independence**: Status is conveyed through icons, not just color

## Testing

Unit tests are provided in `SectionStatus.test.tsx`:

```bash
npm test src/components/questionnaires/SectionStatus.test.tsx
```

Test coverage includes:
- Status configuration (pass/fail/pending)
- Failure reasons handling
- Notes display
- Evaluation metadata
- Visual indicator logic
- Display mode switching
- Tooltip generation
- Aria label generation

## Requirements Satisfied

This component satisfies the following requirements:

- **Requirement 2.1**: Display pass/fail status prominently for internal users
- **Requirement 2.2**: Show aggregate view of all section statuses
- **Requirement 2.3**: Highlight failed sections with visual indicators
- **Requirement 2.4**: Display success indicator for passed sections
- **Requirement 2.5**: Include pass/fail status in reports

## Integration Example

Using SectionStatus with QuestionnaireForm:

```tsx
import QuestionnaireForm from './QuestionnaireForm';
import { SectionStatus } from './SectionStatus';

function QuestionnaireReview({ submission }) {
  return (
    <div className="space-y-6">
      <h2>Questionnaire Review</h2>
      
      {/* Section Status Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Section Status</h3>
        <div className="space-y-2">
          {submission.sections.map((section) => (
            <div key={section.sectionId} className="flex items-center justify-between">
              <span>{section.sectionId}</span>
              <SectionStatus
                sectionId={section.sectionId}
                status={section.status}
                mode="detailed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Overall Status:</span>
          <SectionStatus
            sectionId="overall"
            status={{
              result: submission.overallStatus === 'pass' ? 'pass' : 'fail',
            }}
            mode="detailed"
          />
        </div>
      </div>
    </div>
  );
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lightweight component with minimal re-renders
- No external dependencies
- Optimized SVG icons
- Efficient conditional rendering

## Future Enhancements

Potential improvements for future iterations:

- [ ] Animated transitions between states
- [ ] Custom icon support
- [ ] Expandable/collapsible failure reasons
- [ ] Export status as image/PDF
- [ ] Historical status tracking visualization
- [ ] Bulk status operations
- [ ] Status change notifications


---

# SignatureCapture Component

A comprehensive digital signature capture component that supports both typed and drawn signatures with metadata collection for audit trails and legal compliance.

## Features

### ✅ Dual Signature Modes
- **Typed Mode**: Users type their name as a signature
- **Drawn Mode**: Users draw their signature on a canvas

### ✅ Metadata Capture
Automatically captures:
- Timestamp (when signature was created)
- IP Address (user's IP for audit trail)
- User Agent (browser/device information)
- Signer name and email

### ✅ Signature Preview & Confirmation
- Preview signature before final submission
- Edit capability from preview
- Confirmation step to prevent accidental submissions

### ✅ Terms Acceptance
- Optional terms acceptance checkbox
- Customizable terms text
- Can be disabled if not required

### ✅ Mode Switching
- Optional ability to switch between typed and drawn modes
- Preserves form data when switching modes

### ✅ Canvas Drawing Features
- Smooth drawing with mouse or touch
- Clear signature button
- Touch-friendly for tablets
- Responsive canvas sizing

## Usage

### Basic Typed Signature

```tsx
import SignatureCapture from '../../components/questionnaires/SignatureCapture';
import type { Signature } from '../../types/signature';

const handleSignature = (signature: Signature) => {
  console.log('Signature captured:', signature);
  // Save signature to database
};

<SignatureCapture
  mode="typed"
  onSignature={handleSignature}
/>
```

### Drawn Signature

```tsx
<SignatureCapture
  mode="drawn"
  onSignature={handleSignature}
/>
```

### With Mode Switching

```tsx
<SignatureCapture
  mode="typed"
  allowModeSwitch={true}
  onSignature={handleSignature}
/>
```

### Custom Terms Text

```tsx
<SignatureCapture
  mode="typed"
  onSignature={handleSignature}
  termsText="I agree to the terms and conditions and confirm that all information provided is accurate."
/>
```

### Without Terms Requirement

```tsx
<SignatureCapture
  mode="typed"
  onSignature={handleSignature}
  requireTermsAcceptance={false}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSignature` | `(signature: Signature) => void` | Yes | - | Callback function called when signature is confirmed |
| `mode` | `'typed' \| 'drawn'` | No | `'typed'` | Initial signature mode |
| `allowModeSwitch` | `boolean` | No | `true` | Allow users to switch between typed and drawn modes |
| `requireTermsAcceptance` | `boolean` | No | `true` | Require terms acceptance checkbox |
| `termsText` | `string` | No | `'I confirm that the information provided is accurate and complete.'` | Custom terms text |

## Signature Object

The component returns a `Signature` object with the following structure:

```typescript
interface Signature {
  type: 'typed' | 'drawn';
  data: string; // Plain text for typed, base64 image for drawn
  signerName: string;
  signerEmail: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

### Example Typed Signature

```json
{
  "type": "typed",
  "data": "John Doe",
  "signerName": "John Doe",
  "signerEmail": "john@example.com",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
}
```

### Example Drawn Signature

```json
{
  "type": "drawn",
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "signerName": "Jane Smith",
  "signerEmail": "jane@example.com",
  "timestamp": "2025-01-15T10:35:00.000Z",
  "ipAddress": "192.168.1.2",
  "userAgent": "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)..."
}
```

## User Flow

### Typed Signature Flow

1. User enters full name
2. User enters email address
3. Signature preview appears automatically as they type
4. User accepts terms (if required)
5. User clicks "Preview Signature"
6. Preview screen shows all details
7. User clicks "Confirm Signature" or "Edit"
8. `onSignature` callback is called with signature data

### Drawn Signature Flow

1. User enters full name
2. User enters email address
3. User draws signature on canvas
4. User can clear and redraw if needed
5. User accepts terms (if required)
6. User clicks "Preview Signature"
7. Preview screen shows signature image and details
8. User clicks "Confirm Signature" or "Edit"
9. `onSignature` callback is called with signature data

## Validation

The component validates:

- **Name**: Required, must not be empty
- **Email**: Required, must be valid email format
- **Signature**: 
  - Typed: Name must be entered
  - Drawn: Canvas must have been drawn on
- **Terms**: Must be accepted (if required)

The "Preview Signature" button is disabled until all validations pass.

## Styling

### Typed Signature Display

Typed signatures are displayed in a cursive font style:

```css
.font-signature {
  font-family: 'Brush Script MT', cursive;
  font-size: 1.5rem;
  font-style: italic;
}
```

### Canvas Styling

The drawing canvas:
- White background
- Gray border
- Crosshair cursor
- Responsive sizing (maintains 3:1 aspect ratio)
- Touch-enabled for tablets

### Status Colors

- **Primary Action**: Blue (`bg-blue-600`)
- **Secondary Action**: Gray (`bg-gray-200`)
- **Required Fields**: Red asterisk (`text-red-500`)
- **Borders**: Gray (`border-gray-300`)

## Integration with Questionnaires

### Adding Signature to Questionnaire Submission

```tsx
import QuestionnaireForm from './QuestionnaireForm';
import SignatureCapture from './SignatureCapture';
import { useState } from 'react';

function QuestionnaireWithSignature() {
  const [formData, setFormData] = useState(null);
  const [signature, setSignature] = useState(null);

  const handleFormSubmit = (data) => {
    setFormData(data);
    // Show signature capture
  };

  const handleSignature = async (sig) => {
    setSignature(sig);
    
    // Submit both form data and signature
    const submission = {
      ...formData,
      signature: sig,
    };
    
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  };

  return (
    <div>
      {!formData ? (
        <QuestionnaireForm
          config={config}
          mode="edit"
          onSubmit={handleFormSubmit}
        />
      ) : !signature ? (
        <SignatureCapture
          mode="typed"
          allowModeSwitch={true}
          onSignature={handleSignature}
        />
      ) : (
        <div>Submission complete!</div>
      )}
    </div>
  );
}
```

## IP Address Capture

The component attempts to fetch the user's IP address using the ipify API:

```javascript
fetch('https://api.ipify.org?format=json')
  .then(res => res.json())
  .then(data => setIpAddress(data.ip))
  .catch(() => setIpAddress('unknown'));
```

For production use, you may want to:
- Use your own IP detection service
- Capture IP on the server side
- Use Netlify Functions to get the client IP

### Server-side IP Capture Example

```typescript
// In a Netlify Function
export const handler = async (event) => {
  const clientIP = event.headers['x-forwarded-for'] || 
                   event.headers['client-ip'] || 
                   'unknown';
  
  return {
    statusCode: 200,
    body: JSON.stringify({ ip: clientIP }),
  };
};
```

## Canvas Drawing Implementation

The component uses HTML5 Canvas API for drawing:

```typescript
// Start drawing
const startDrawing = (e) => {
  setIsDrawing(true);
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(x, y);
};

// Draw
const draw = (e) => {
  if (!isDrawing) return;
  const ctx = canvas.getContext('2d');
  ctx.lineTo(x, y);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

// Stop drawing
const stopDrawing = () => {
  setIsDrawing(false);
};
```

### Touch Support

The component supports both mouse and touch events:

```tsx
<canvas
  onMouseDown={startDrawing}
  onMouseMove={draw}
  onMouseUp={stopDrawing}
  onTouchStart={startDrawing}
  onTouchMove={draw}
  onTouchEnd={stopDrawing}
  className="touch-none" // Prevents scrolling while drawing
/>
```

## Accessibility

- **Labels**: All form fields have proper labels
- **Required Indicators**: Visual asterisks for required fields
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus states
- **Error Messages**: Clear validation messages
- **ARIA Attributes**: Proper ARIA labels where needed

## Security Considerations

### Data Storage

- Store signatures securely in your database
- Encrypt sensitive signature data
- Implement access controls
- Maintain audit logs

### Validation

- Validate signature data on the server
- Verify email format server-side
- Check timestamp for reasonable values
- Validate IP address format

### Legal Compliance

The component captures metadata for legal compliance:

- **Timestamp**: Proves when signature was created
- **IP Address**: Provides location context
- **User Agent**: Identifies device/browser used
- **Email**: Links signature to user identity

Consult with legal counsel to ensure compliance with:
- E-SIGN Act (US)
- UETA (US)
- eIDAS (EU)
- Local electronic signature laws

## Testing

Unit tests are provided in `SignatureCapture.test.tsx`:

```bash
npm test src/components/questionnaires/SignatureCapture.test.tsx
```

Test coverage includes:
- Signature interface structure
- Validation logic
- Metadata capture
- Signature modes (typed/drawn)
- Component props
- Email validation
- Timestamp capture

## Demo

A demo page is available at `/questionnaires/signature-demo` showing:
- Typed signature mode
- Drawn signature mode
- Mode switching
- Captured signature display

## Requirements Satisfied

This component satisfies the following requirements:

- **Requirement 3.1**: Require digital signature before questionnaire submission
- **Requirement 3.2**: Record signer's name, email, timestamp, and IP address
- **Requirement 3.3**: Store signature securely with questionnaire submission
- **Requirement 3.6**: Provide clear signature input interface (typed or drawn)

## Browser Support

- Chrome (latest) ✓
- Firefox (latest) ✓
- Safari (latest) ✓
- Edge (latest) ✓
- Mobile Safari (iOS) ✓
- Chrome Mobile (Android) ✓

## Performance

- Lightweight component (~15KB)
- No external dependencies (except React)
- Optimized canvas rendering
- Efficient state management
- Minimal re-renders

## Troubleshooting

### Canvas not drawing

**Issue**: Canvas doesn't respond to mouse/touch events

**Solution**: Ensure canvas has proper dimensions and the `touch-none` class is applied

### IP address shows "unknown"

**Issue**: IP address fetch fails

**Solution**: 
- Check network connectivity
- Implement server-side IP capture
- Use alternative IP detection service

### Signature image too large

**Issue**: Base64 signature data is very large

**Solution**:
- Reduce canvas dimensions
- Compress image before storing
- Use JPEG instead of PNG for smaller file size

### Touch drawing not working on mobile

**Issue**: Drawing doesn't work on touch devices

**Solution**:
- Ensure `touch-none` class is applied
- Verify touch event handlers are attached
- Test on actual device (not just browser emulation)

## Future Enhancements

Potential improvements for future iterations:

- [ ] Signature image compression
- [ ] Multiple signature formats (SVG, JPEG)
- [ ] Signature templates/styles
- [ ] Undo/redo for drawn signatures
- [ ] Signature verification
- [ ] Biometric signature capture
- [ ] Signature comparison/matching
- [ ] Multi-party signatures
- [ ] Signature expiration
- [ ] Signature revocation
