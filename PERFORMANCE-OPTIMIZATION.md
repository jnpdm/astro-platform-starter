# Performance Optimization Guide

This document describes the performance optimizations implemented in the Kuiper Partner Onboarding Hub.

## Overview

The following optimizations have been implemented to improve page load times, reduce bundle sizes, and enhance overall application performance:

1. **Code Splitting** - Separate chunks for different component groups
2. **Lazy Loading** - Deferred loading of non-critical components
3. **Configuration Caching** - In-memory caching of JSON configurations
4. **API Response Optimization** - Field selection and pagination
5. **Bundle Size Analysis** - Tools to monitor and optimize bundle size

## Implemented Optimizations

### 1. Code Splitting

**Location**: `astro.config.mjs`

The build configuration now splits code into logical chunks:

- `react-vendor`: React and React DOM (shared across all React components)
- `questionnaire-components`: All questionnaire-related components
- `documentation`: Documentation hub components

**Benefits**:
- Reduces initial bundle size
- Enables parallel loading of chunks
- Improves caching (vendor code changes less frequently)

**Usage**: Automatic - no code changes required

### 2. Lazy Loading Components

**Files**:
- `src/components/documentation/DocumentationHubWrapper.tsx`
- `src/components/questionnaires/QuestionnaireFormWrapper.tsx`

These wrapper components use React's `lazy()` and `Suspense` to defer loading of heavy components until they're needed.

**Benefits**:
- Faster initial page load
- Reduced JavaScript execution time
- Better perceived performance with loading skeletons

**Usage**:
```tsx
// Instead of:
import { DocumentationHub } from './DocumentationHub';

// Use:
import DocumentationHubWrapper from './DocumentationHubWrapper';

// Then render with client:load
<DocumentationHubWrapper sections={sections} client:load />
```

### 3. Configuration Caching

**Location**: `src/utils/configCache.ts`

Implements in-memory caching for frequently accessed configuration files:
- Questionnaire configurations
- Documentation configuration
- Gates configuration

**Benefits**:
- Reduces file system reads
- Faster page rendering
- 5-minute TTL ensures fresh data

**Usage**:
```typescript
import { loadQuestionnaireConfig, loadDocumentationConfig, loadGatesConfig } from '../utils/configCache';

// Instead of:
import config from '../config/gates.json';

// Use:
const config = await loadGatesConfig();
```

### 4. API Response Optimization

**Location**: `src/utils/apiOptimization.ts`

Provides utilities for optimizing API responses:

#### Field Selection
Request only the fields you need:
```
GET /api/partners?fields=id,partnerName,tier
```

#### Summary Mode
Get minimal fields for list views:
```
GET /api/partners?summary=true
```

#### Pagination
Paginate large result sets:
```
GET /api/partners?page=1&pageSize=20
```

**Benefits**:
- Reduced payload sizes
- Faster network transfer
- Lower memory usage
- Better mobile performance

### 5. Bundle Size Analysis

**Location**: `scripts/analyze-bundle.js`

A script to analyze the built bundle and identify optimization opportunities.

**Usage**:
```bash
npm run build
npm run analyze:bundle
```

**Output**:
- Total bundle size breakdown
- Largest files identified
- Warnings for files > 200 KB
- Errors for files > 500 KB
- Optimization recommendations

### 6. Performance Monitoring

**Location**: `src/utils/performanceMonitor.ts`

Utilities for monitoring performance in development and production.

**Features**:
- Measure function execution time
- Track Web Vitals (LCP, FID, CLS)
- Performance summary logging
- Automatic monitoring in dev mode

**Usage**:
```typescript
import { performanceMonitor } from '../utils/performanceMonitor';

// Measure a function
performanceMonitor.start('loadData');
await loadData();
performanceMonitor.end('loadData');

// Or use the measure helper
const data = await performanceMonitor.measure('loadData', () => loadData());

// Enable in production with query param
// https://your-site.com?perf=true
```

## Performance Targets

### Bundle Size Targets
- Initial JavaScript bundle: < 200 KB
- Total JavaScript: < 500 KB
- Individual chunks: < 200 KB
- CSS: < 100 KB

### Loading Performance Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

## Best Practices

### 1. Use Lazy Loading for Heavy Components
```tsx
// Good: Lazy load questionnaire forms
import QuestionnaireFormWrapper from './QuestionnaireFormWrapper';
<QuestionnaireFormWrapper client:load />

// Avoid: Eager loading heavy components on every page
import QuestionnaireForm from './QuestionnaireForm';
```

### 2. Request Only Needed Fields
```typescript
// Good: Request only what you need
const partners = await fetch('/api/partners?fields=id,partnerName,tier');

// Avoid: Fetching all fields when you only need a few
const partners = await fetch('/api/partners');
```

### 3. Use Configuration Caching
```typescript
// Good: Use cached configuration
const config = await loadGatesConfig();

// Avoid: Direct imports that bypass caching
import config from '../config/gates.json';
```

### 4. Implement Pagination for Large Lists
```typescript
// Good: Paginate large result sets
const partners = await fetch('/api/partners?page=1&pageSize=20');

// Avoid: Loading all records at once
const partners = await fetch('/api/partners');
```

### 5. Monitor Performance Regularly
```bash
# Run after every significant change
npm run build
npm run analyze:bundle
```

## Monitoring in Production

### Enable Performance Monitoring
Add `?perf=true` to any URL to enable performance monitoring:
```
https://your-site.com/documentation?perf=true
```

This will log:
- Component load times
- API request durations
- Web Vitals metrics
- Performance summary on page unload

### Check Bundle Size
After each deployment, verify bundle sizes haven't regressed:
```bash
npm run build
npm run analyze:bundle
```

## Future Optimizations

Potential areas for further optimization:

1. **Image Optimization**
   - Implement responsive images
   - Use modern formats (WebP, AVIF)
   - Lazy load images below the fold

2. **Service Worker**
   - Cache static assets
   - Offline support for documentation
   - Background sync for form submissions

3. **Database Query Optimization**
   - Implement indexes in Netlify Blobs
   - Use query result caching
   - Optimize data structures

4. **CDN Optimization**
   - Use Netlify Edge Functions for dynamic content
   - Implement edge caching strategies
   - Optimize cache headers

5. **Component Optimization**
   - Implement virtual scrolling for long lists
   - Use React.memo for expensive components
   - Optimize re-render patterns

## Troubleshooting

### Bundle Size Increased
1. Run `npm run analyze:bundle` to identify large files
2. Check for accidentally imported large dependencies
3. Verify code splitting is working correctly
4. Consider lazy loading additional components

### Slow Page Loads
1. Enable performance monitoring with `?perf=true`
2. Check Network tab in DevTools for slow requests
3. Verify API responses are optimized (use field selection)
4. Check for unnecessary re-renders in React components

### Cache Issues
1. Clear configuration cache: `configCache.clear()`
2. Verify cache TTL is appropriate (default: 5 minutes)
3. Check for stale data in development

## Resources

- [Astro Performance Guide](https://docs.astro.build/en/guides/performance/)
- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Netlify Performance](https://docs.netlify.com/performance/)

## Requirements Validation

This implementation satisfies:
- **Requirement 8.1**: Clean, professional dashboard interface with responsive design
- **Requirement 8.2**: Responsive interface working on desktop and tablet devices

The optimizations ensure fast load times and smooth interactions across all supported devices.
