# Browser Diagnostic Steps for Questionnaire Loading Issue

## What I've Done

1. ✅ Verified all component files exist
2. ✅ Verified all config JSON files exist  
3. ✅ Checked for TypeScript/build errors (none found)
4. ✅ Verified component exports are correct
5. ✅ Added debug logging to Gate 0 page and component

## Next Steps: Browser Testing

### Step 1: Open Browser Console
1. Navigate to a questionnaire page (e.g., `/questionnaires/gate-0-kickoff?partnerId=test`)
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the **Console** tab

### Step 2: Look for Debug Messages

You should see these console messages if everything is working:
```
[Gate0] Script loaded
[Gate0] astro:page-load event fired
[Gate0] Elements found: {loadingIndicator: true, questionnaireContent: true}
[Gate0Questionnaire] Component rendering {hasConfig: true, configId: "gate-0-kickoff", ...}
[Gate0Questionnaire] Component mounted successfully
[Gate0] Hiding loading indicator
```

### Step 3: Check for Errors

Look for any RED error messages in the console. Common errors:

**Error Type 1: Module Loading Error**
```
Failed to load module script: Expected a JavaScript module script...
```
**Fix**: This means the component isn't being loaded as a module. Check Astro config.

**Error Type 2: Import Error**
```
Cannot find module '@/components/questionnaires/Gate0Questionnaire'
```
**Fix**: Import path is wrong or component doesn't exist.

**Error Type 3: Hydration Error**
```
Hydration failed because the initial UI does not match...
```
**Fix**: Server-rendered HTML doesn't match client-side React.

**Error Type 4: Props Error**
```
Cannot read property 'sections' of undefined
```
**Fix**: Config is not being passed correctly to component.

### Step 4: Inspect the DOM

1. Go to the **Elements** tab in Dev Tools
2. Find the `#questionnaire-content` div
3. Check if it contains the React component markup

**What to look for**:
- Is the div empty? → Component didn't render
- Is there content but it's hidden? → CSS issue
- Is the loading indicator still visible? → Script didn't run

### Step 5: Check Network Tab

1. Go to the **Network** tab
2. Reload the page
3. Look for failed requests (red text)

**Common issues**:
- `gate-0-kickoff.json` - 404 → Config file not found
- Component chunk files - 404 → Build issue
- Any 500 errors → Server-side error

### Step 6: Test Component Isolation

Try accessing the component directly by adding this to the page temporarily:

```astro
<div style="border: 2px solid red; padding: 20px; margin: 20px;">
    <h2>Direct Component Test</h2>
    <Gate0Questionnaire 
        client:only="react"
        config={gate0Config} 
        existingData={null} 
        partnerId="test" 
        mode="edit" 
    />
</div>
```

If this renders, the issue is with the ToastProvider or the wrapper structure.

## Common Issues and Solutions

### Issue 1: Loading Indicator Never Hides
**Symptoms**: Spinner stays visible forever
**Cause**: Script not running or component not mounting
**Debug**: Check console for script messages
**Fix**: Ensure `astro:page-load` event is firing

### Issue 2: Blank Page After Header
**Symptoms**: Header shows, nothing else
**Cause**: Component failed to render
**Debug**: Check console for React errors
**Fix**: Verify config is valid and props are correct

### Issue 3: Error Boundary Shows
**Symptoms**: Red error message appears
**Cause**: JavaScript error in component
**Debug**: Check console for the actual error
**Fix**: Fix the error in the component code

### Issue 4: Content Exists But Not Visible
**Symptoms**: DOM shows content but screen is blank
**Cause**: CSS hiding the content
**Debug**: Inspect element and check computed styles
**Fix**: Remove `display: none` or adjust z-index

## Quick Test Commands

### Test if config loads:
Open console and run:
```javascript
fetch('/config/questionnaires/gate-0-kickoff.json')
  .then(r => r.json())
  .then(d => console.log('Config loaded:', d))
  .catch(e => console.error('Config failed:', e));
```

### Test if component is in DOM:
```javascript
console.log('Questionnaire content:', document.getElementById('questionnaire-content'));
console.log('Has children:', document.getElementById('questionnaire-content')?.children.length);
```

### Force hide loading indicator:
```javascript
document.getElementById('loading-indicator').style.display = 'none';
```

## What to Report Back

Please provide:
1. **Console messages** - Copy all messages, especially errors
2. **Network failures** - List any 404 or 500 errors
3. **DOM state** - Is `#questionnaire-content` empty or full?
4. **Which debug messages appear** - Which of the expected messages do you see?
5. **Screenshots** - Console tab and Elements tab

## Expected Working Flow

1. Page loads → Header visible
2. Script runs → `[Gate0] Script loaded`
3. Astro event fires → `[Gate0] astro:page-load event fired`
4. Component renders → `[Gate0Questionnaire] Component rendering`
5. Component mounts → `[Gate0Questionnaire] Component mounted successfully`
6. Loading hides → `[Gate0] Hiding loading indicator`
7. Form appears → User sees questionnaire fields

If any step fails, that's where the problem is!
