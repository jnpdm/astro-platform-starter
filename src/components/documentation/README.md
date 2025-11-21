# Documentation Hub Component

The `DocumentationHub` component provides a centralized interface for accessing documentation resources organized by gate, phase, and user role. It supports filtering, searching, and contextual display of documentation relevant to the partner onboarding journey.

## Features

- **Search Functionality**: Full-text search across titles, descriptions, and link content
- **Multi-dimensional Filtering**: Filter by gate, phase, and user role
- **Expandable/Collapsible Sections**: Organize documentation into manageable sections
- **Contextual Mode**: Automatically filter documentation based on current gate and user role
- **Responsive Design**: Works on desktop and tablet devices
- **External Link Handling**: Properly handles internal and external links with appropriate attributes

## Usage

### Basic Usage

```tsx
import { DocumentationHub } from '@/components/documentation/DocumentationHub';
import documentationData from '@/config/documentation.json';

<DocumentationHub sections={documentationData.sections} />
```

### Contextual Mode

Display only documentation relevant to a specific gate and user role:

```tsx
<DocumentationHub 
  sections={documentationData.sections}
  contextual={true}
  currentGate="gate-1"
  userRole="PDM"
/>
```

## Props

### `DocumentationHubProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sections` | `DocumentationSection[]` | Yes | - | Array of documentation sections to display |
| `contextual` | `boolean` | No | `false` | Enable contextual filtering by gate and role |
| `currentGate` | `GateId` | No | - | Current gate for contextual filtering |
| `userRole` | `UserRole` | No | - | User role for contextual filtering |

## Data Structure

### DocumentationSection

```typescript
interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  gate: GateId; // 'pre-contract' | 'gate-0' | 'gate-1' | 'gate-2' | 'gate-3' | 'post-launch' | 'all'
  phase?: string; // e.g., '1A', '1B', '2A'
  links: DocumentationLink[];
  relevantRoles: UserRole[]; // ['PAM', 'PDM', 'TPM', 'PSM', 'TAM', 'Admin']
}
```

### DocumentationLink

```typescript
interface DocumentationLink {
  title: string;
  url: string;
  type: 'internal' | 'external';
  icon?: string;
  description?: string;
}
```

## Configuration

Documentation is configured in `src/config/documentation.json`. Each section should include:

- **id**: Unique identifier for the section
- **title**: Display title
- **description**: Brief description of the section
- **gate**: Associated gate or 'all' for cross-gate resources
- **phase**: Optional phase identifier (e.g., '1A', '2B')
- **relevantRoles**: Array of roles that should see this documentation
- **links**: Array of documentation links

### Example Configuration

```json
{
  "sections": [
    {
      "id": "gate-1-phase-1a",
      "title": "Gate 1: Phase 1A - Onboarding Kickoff",
      "description": "Resources for Phase 1A (Weeks 1-3)",
      "gate": "gate-1",
      "phase": "1A",
      "relevantRoles": ["PDM", "PAM", "TPM"],
      "links": [
        {
          "title": "Kickoff Template",
          "url": "/docs/kickoff-template",
          "type": "internal",
          "description": "Template for conducting kickoff meetings"
        }
      ]
    }
  ]
}
```

## Features in Detail

### Search

The search functionality searches across:
- Section titles
- Section descriptions
- Link titles
- Link descriptions

Search is case-insensitive and updates results in real-time.

### Filtering

Three independent filters are available:

1. **Gate Filter**: Show only documentation for a specific gate
2. **Phase Filter**: Show only documentation for a specific phase
3. **Role Filter**: Show only documentation relevant to a specific role

Filters can be combined and work together with search.

### Contextual Mode

When `contextual={true}` is set, the component automatically filters documentation based on:
- `currentGate`: Shows only documentation for the specified gate and 'all' gates
- `userRole`: Shows only documentation relevant to the specified role

This is useful for embedding the component in gate-specific pages or role-specific dashboards.

### Expand/Collapse

- **Expand All**: Opens all filtered sections to show their links
- **Collapse All**: Closes all sections
- **Individual Toggle**: Click any section header to toggle its expanded state

### Link Handling

- **Internal Links**: Open in the same tab
- **External Links**: Open in a new tab with `rel="noopener noreferrer"` for security
- **Link Descriptions**: Display below the link title when available

## Styling

The component uses Tailwind CSS classes and follows the design system:

- **Primary Color**: Blue (for interactive elements)
- **Background**: White cards on gray-50 background
- **Borders**: Gray-200 for subtle separation
- **Hover States**: Subtle color and shadow changes

## Accessibility

- Semantic HTML structure
- Proper label associations for form controls
- Keyboard navigation support
- ARIA attributes where appropriate
- Focus states for interactive elements

## Testing

Comprehensive test coverage includes:

- Rendering and display
- Search functionality
- Filter functionality (gate, phase, role)
- Expand/collapse behavior
- Contextual mode
- Link rendering (internal vs external)
- Combined filters
- Edge cases (no results, empty state)

Run tests:

```bash
npm test -- src/components/documentation/DocumentationHub.test.tsx
```

## Integration with Pages

### Full Documentation Page

```astro
---
import documentationData from '@/config/documentation.json';
import { DocumentationHub } from '@/components/documentation/DocumentationHub';
---

<DocumentationHub 
  sections={documentationData.sections} 
  client:load 
/>
```

### Contextual Documentation in Gate Pages

```astro
---
import documentationData from '@/config/documentation.json';
import { DocumentationHub } from '@/components/documentation/DocumentationHub';

const currentGate = 'gate-1';
const userRole = 'PDM';
---

<DocumentationHub 
  sections={documentationData.sections}
  contextual={true}
  currentGate={currentGate}
  userRole={userRole}
  client:load 
/>
```

## Requirements Satisfied

This component satisfies the following requirements from the Partner Onboarding Hub specification:

- **5.1**: Documentation section with links organized by gate
- **5.2**: Resources organized by phase
- **5.3**: Role-based filtering of documentation
- **5.4**: Contextual documentation links relevant to sections
- **5.6**: Easy management through JSON configuration

## Future Enhancements

Potential improvements for future iterations:

- Bookmark/favorite documentation links
- Recently viewed documentation tracking
- Documentation usage analytics
- Inline documentation preview
- PDF export of documentation sections
- Version history for documentation links
- User feedback on documentation helpfulness
