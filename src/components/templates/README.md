# Template Editor Components

This directory contains React components for editing questionnaire templates.

## Components

### FieldEditor

The `FieldEditor` component allows editing of individual questionnaire template fields. It supports all field types and their specific properties.

**Features:**
- Edit field properties (label, helpText, placeholder, required)
- Support for all field types (text, textarea, select, radio, checkbox, date)
- Options editor for select/radio/checkbox types
- Field reordering (move up/down)
- Field deletion with confirmation
- Inline validation

**Props:**
```typescript
interface FieldEditorProps {
    field: QuestionField;
    onChange: (updatedField: QuestionField) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}
```

**Usage:**
```tsx
<FieldEditor
    field={field}
    onChange={(updatedField) => handleFieldChange(index, updatedField)}
    onDelete={() => handleFieldDelete(index)}
    onMoveUp={() => handleMoveUp(index)}
    onMoveDown={() => handleMoveDown(index)}
    canMoveUp={index > 0}
    canMoveDown={index < fields.length - 1}
/>
```

### TemplateEditorWrapper

The `TemplateEditorWrapper` component manages the list of fields and integrates with the `FieldEditor` component.

**Features:**
- Field list management
- Adding new fields
- Reordering fields
- Deleting fields
- Template validation
- Saving template changes with versioning

**Props:**
```typescript
interface TemplateEditorWrapperProps {
    template: QuestionnaireTemplate;
    onSave: (updatedTemplate: QuestionnaireTemplate) => Promise<void>;
    onCancel: () => void;
}
```

**Usage in Astro:**
```astro
---
import { getCurrentTemplate } from '../utils/templateStorage';

const template = await getCurrentTemplate('gate-0');
---

<div id="template-editor-root" data-template={JSON.stringify(template)}></div>

<script>
    import { createRoot } from 'react-dom/client';
    import TemplateEditorWrapper from '../components/templates/TemplateEditorWrapper';
    
    const root = document.getElementById('template-editor-root');
    const template = JSON.parse(root.dataset.template);
    
    createRoot(root).render(
        <TemplateEditorWrapper
            template={template}
            onSave={async (updatedTemplate) => {
                // Save template via API
                const response = await fetch(`/api/templates/${template.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedTemplate)
                });
                
                if (response.ok) {
                    window.location.href = '/admin/templates';
                }
            }}
            onCancel={() => {
                window.location.href = '/admin/templates';
            }}
        />
    );
</script>
```

## Field Types

The following field types are supported:

1. **text** - Single-line text input
2. **textarea** - Multi-line text input
3. **select** - Dropdown selection (requires options)
4. **radio** - Radio button group (requires options)
5. **checkbox** - Checkbox group (requires options)
6. **date** - Date picker

## Validation

The template editor performs the following validations:

- All fields must have labels
- No duplicate field IDs
- Select/radio/checkbox fields must have at least one option
- Field type must be one of the supported types

## Requirements

This component satisfies the following requirements:

- **Requirement 8.4**: Support adding new questions with field type selection
- **Requirement 8.7**: Support modifying question text, help text, placeholder text, and required status
- **Requirement 8.8**: Allow defining option values for select, radio, or checkbox fields
