# Implementation Plan

- [x] 1. Fix API endpoint cookie handling
  - [x] 1.1 Update GET endpoint in `/api/partner/[id].ts` to extract and pass cookie header to `getUserSession()`
    - Extract cookie header from request: `request.headers.get('cookie')`
    - Pass to getUserSession: `getUserSession(cookieHeader || undefined)`
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 1.2 Update PUT endpoint in `/api/partner/[id].ts` to extract and pass cookie header to `getUserSession()`
    - Extract cookie header from request: `request.headers.get('cookie')`
    - Pass to getUserSession: `getUserSession(cookieHeader || undefined)`
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 1.3 Write property test for API authentication
    - **Property 5: GET endpoint authentication**
    - **Validates: Requirements 2.1**

  - [ ]* 1.4 Write property test for PUT authentication
    - **Property 6: PUT endpoint authentication**
    - **Validates: Requirements 2.2**

- [x] 2. Create partner edit page
  - [x] 2.1 Create `/src/pages/partner/edit/[id].astro` file
    - Server-side: Load partner data using `getPartner(id)`
    - Server-side: Check edit permissions using `canEditPartner(currentUser, partner)`
    - Server-side: Extract cookie header and pass to `getUserSession()`
    - Server-side: Redirect if partner not found or access denied
    - Client-side: Render form pre-populated with partner data
    - Client-side: Handle form submission with PUT to `/api/partner/${id}`
    - Client-side: Redirect to `/partner/${id}` on success
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write property test for edit form pre-population
    - **Property 2: Edit form pre-population**
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for edit form submission
    - **Property 3: Edit form submission**
    - **Validates: Requirements 1.3**

- [x] 3. Update partner detail page edit link
  - [x] 3.1 Fix "Edit Partner" button link in `/src/pages/partner/[id].astro`
    - Change href from `/api/partner/${partner.id}` to `/partner/edit/${partner.id}`
    - Ensure button only renders when `canEdit` is true
    - _Requirements: 1.1, 1.4_

  - [ ]* 3.2 Write property test for edit button visibility
    - **Property 4: Edit button visibility**
    - **Validates: Requirements 1.4**

- [x] 4. Investigate and fix gate page content loading
  - [x] 4.1 Verify gate page component imports and hydration directives
    - Check all gate pages have correct import paths
    - Verify `client:load` directive is present on questionnaire components
    - Verify `ToastProvider` wrapper has `client:load` directive
    - Test each gate page loads and renders content
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Add error boundaries and loading states to gate pages
    - Add error message display for component load failures
    - Add loading indicator while components hydrate
    - Add fallback content if hydration fails
    - _Requirements: 3.4_

  - [ ]* 4.3 Write property test for gate page rendering
    - **Property 9: Gate page component rendering**
    - **Validates: Requirements 3.1, 3.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
