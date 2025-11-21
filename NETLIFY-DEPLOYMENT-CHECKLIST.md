# Netlify Deployment Checklist

**Project**: Kuiper Partner Onboarding Hub
**Version**: 1.0.0
**Deployment Date**: _______________
**Deployed By**: _______________

---

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code committed to Git repository
- [ ] All unit tests passing (362/362)
- [ ] Integration tests run (58/70 passing - acceptable)
- [ ] No critical bugs or security issues
- [ ] `package.json` dependencies up to date
- [ ] `netlify.toml` configuration verified
- [ ] Environment variables documented

### Local Testing
- [ ] Run `npm install` to verify dependencies
- [ ] Run `npm test -- --run` to verify all unit tests pass
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run preview` to test production build locally
- [ ] Test key user flows manually in preview

### Documentation Review
- [ ] README.md is up to date
- [ ] Deployment guide reviewed
- [ ] User guides available for all roles
- [ ] FAQ document complete
- [ ] Troubleshooting guide available

---

## Netlify Account Setup

### Account Access
- [ ] Netlify account created or access granted
- [ ] Team permissions configured (if applicable)
- [ ] Billing information verified
- [ ] Account email confirmed

### Repository Connection
- [ ] GitHub/GitLab/Bitbucket account connected to Netlify
- [ ] Repository access granted to Netlify
- [ ] Branch permissions configured

---

## Create Netlify Site

### Option A: Via Netlify Dashboard

#### Step 1: Create New Site
- [ ] Log in to https://app.netlify.com
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Select Git provider (GitHub/GitLab/Bitbucket)
- [ ] Authorize Netlify to access repositories
- [ ] Select repository: `[your-repo-name]`
- [ ] Select branch: `main` (or your production branch)

#### Step 2: Configure Build Settings
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Functions directory: `.netlify/functions` (auto-detected)
- [ ] Click "Deploy site"

#### Step 3: Note Site Information
- [ ] Site name: _______________
- [ ] Site ID: _______________
- [ ] Site URL: _______________

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
- [ ] npm install -g netlify-cli

# Login to Netlify
- [ ] netlify login

# Initialize site
- [ ] netlify init

# Follow prompts:
- [ ] Create & configure a new site
- [ ] Team: [your-team]
- [ ] Site name: [your-site-name]
- [ ] Build command: npm run build
- [ ] Directory to deploy: dist

# Note the site URL
- [ ] Site URL: _______________
```

---

## Configure Environment Variables

### Access Environment Variables
- [ ] Go to Site Settings → Environment Variables
- [ ] Or use: `netlify env:set [KEY] [VALUE]`

### Required Variables
- [ ] `NODE_VERSION` = `18.20.8`
- [ ] `NPM_VERSION` = `9.0.0`
- [ ] `NETLIFY_BLOBS_CONTEXT` = `production`
- [ ] `AUTH_ENABLED` = `true`

### Optional Variables (if needed)
- [ ] `NETLIFY_SITE_ID` = `[your-site-id]`
- [ ] Custom environment variables (if any)

### Verify Variables
- [ ] All required variables set
- [ ] No sensitive data exposed in Git
- [ ] Variable values are correct

---

## Enable Netlify Identity

### Step 1: Enable Identity
- [ ] Go to Site Settings → Identity
- [ ] Click "Enable Identity"
- [ ] Wait for confirmation message

### Step 2: Configure Registration
- [ ] Set registration to "Invite only" (recommended)
- [ ] Disable "Open registration"
- [ ] Save settings

### Step 3: Configure External Providers (Optional)
- [ ] Enable Google OAuth (if desired)
- [ ] Enable GitHub OAuth (if desired)
- [ ] Enable GitLab OAuth (if desired)
- [ ] Configure OAuth app credentials

### Step 4: Customize Email Templates (Optional)
- [ ] Invitation email template
- [ ] Confirmation email template
- [ ] Password recovery email template
- [ ] Email sender name and address

### Step 5: Configure Security Settings
- [ ] Set password requirements:
  - [ ] Minimum length: 12 characters
  - [ ] Require uppercase letters
  - [ ] Require lowercase letters
  - [ ] Require numbers
  - [ ] Require special characters
- [ ] Enable multi-factor authentication (optional)
- [ ] Set session duration: 1 week (default)

---

## Create Users

### Step 1: Create Admin User
- [ ] Go to Identity → Invite users
- [ ] Enter admin email: _______________
- [ ] Admin receives invitation email
- [ ] Admin clicks link and sets password
- [ ] Admin confirms account

### Step 2: Assign Admin Role
- [ ] Click on admin user in Identity dashboard
- [ ] Click "Edit user metadata"
- [ ] Add metadata:
  ```json
  {
    "role": "Admin"
  }
  ```
- [ ] Click "Save"
- [ ] Verify role is saved

### Step 3: Create Test Users (Recommended)
- [ ] PAM test user: _______________
  - [ ] Invited
  - [ ] Accepted invitation
  - [ ] Role assigned: "PAM"
  
- [ ] PDM test user: _______________
  - [ ] Invited
  - [ ] Accepted invitation
  - [ ] Role assigned: "PDM"
  
- [ ] TPM test user: _______________
  - [ ] Invited
  - [ ] Accepted invitation
  - [ ] Role assigned: "TPM"
  
- [ ] PSM/TAM test user: _______________
  - [ ] Invited
  - [ ] Accepted invitation
  - [ ] Role assigned: "PSM" or "TAM"

### Step 4: Create Production Users
- [ ] User 1: _______________ (Role: _______)
- [ ] User 2: _______________ (Role: _______)
- [ ] User 3: _______________ (Role: _______)
- [ ] User 4: _______________ (Role: _______)
- [ ] User 5: _______________ (Role: _______)

---

## Enable Netlify Blobs

### Verify Blobs Enabled
- [ ] Go to Site Settings → Blobs
- [ ] Verify "Enabled" status
- [ ] Note: Blobs are automatically enabled for all sites

### Verify Stores Will Be Created
- [ ] `partners` store (created automatically on first use)
- [ ] `submissions` store (created automatically on first use)

---

## Configure Custom Domain (Optional)

### Step 1: Add Custom Domain
- [ ] Go to Site Settings → Domain management
- [ ] Click "Add custom domain"
- [ ] Enter domain: _______________
- [ ] Verify domain ownership

### Step 2: Configure DNS
- [ ] Add DNS records as instructed by Netlify
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify domain is accessible

### Step 3: Enable HTTPS
- [ ] Netlify automatically provisions SSL certificate
- [ ] Wait for certificate to be issued
- [ ] Verify HTTPS is working
- [ ] Enable "Force HTTPS" redirect

---

## Deploy Application

### Automatic Deployment (Recommended)
- [ ] Push code to main branch
- [ ] Netlify automatically detects push
- [ ] Build starts automatically
- [ ] Monitor build progress in Netlify dashboard

### Manual Deployment (Alternative)
```bash
- [ ] netlify deploy --prod
- [ ] Confirm deployment
- [ ] Note deployment URL
```

### Monitor Deployment
- [ ] Build started: _______________
- [ ] Build completed: _______________
- [ ] Deploy completed: _______________
- [ ] Deployment URL: _______________

---

## Post-Deployment Verification

### Immediate Checks (0-15 minutes)

#### Step 1: Verify Site is Live
- [ ] Open site URL in browser
- [ ] Site loads without errors
- [ ] No 404 or 500 errors
- [ ] SSL certificate is valid (HTTPS)

#### Step 2: Test Authentication
- [ ] Navigate to site
- [ ] Click login/sign in
- [ ] Netlify Identity widget appears
- [ ] Can log in with admin account
- [ ] Redirected to dashboard after login

#### Step 3: Test Dashboard
- [ ] Dashboard loads correctly
- [ ] Navigation menu visible
- [ ] No console errors (F12)
- [ ] Styling looks correct

#### Step 4: Test Key Pages
- [ ] Dashboard: _______________
- [ ] Documentation: _______________
- [ ] Reports: _______________
- [ ] Pre-Contract Questionnaire: _______________
- [ ] Gate 0 Questionnaire: _______________

#### Step 5: Test Role-Based Access
- [ ] Log in as Admin
  - [ ] Can access all pages
  - [ ] Can see all partners
  - [ ] Can access all gates
  
- [ ] Log in as PAM
  - [ ] Can access owned partners
  - [ ] Can access all gates for owned partners
  
- [ ] Log in as PDM
  - [ ] Can access Pre-Contract through Gate 1
  - [ ] Cannot access Gate 2 or 3
  
- [ ] Log in as TPM
  - [ ] Can access Gate 2 only
  
- [ ] Log in as PSM/TAM
  - [ ] Can access Gate 3 and Post-Launch

### Short-Term Monitoring (15 minutes - 1 hour)

#### Step 6: Test Data Persistence
- [ ] Create a test partner
- [ ] Partner saves successfully
- [ ] Partner appears in dashboard
- [ ] Can retrieve partner details
- [ ] Can update partner information

#### Step 7: Test Questionnaire Submission
- [ ] Open Pre-Contract questionnaire
- [ ] Fill out form fields
- [ ] Auto-save works
- [ ] Can submit questionnaire
- [ ] Signature capture works
- [ ] Submission saves successfully

#### Step 8: Monitor Error Logs
- [ ] Go to Netlify Dashboard → Functions
- [ ] Check for any errors
- [ ] Go to Netlify Dashboard → Deploys → Deploy log
- [ ] Verify no build warnings or errors

#### Step 9: Check Performance
- [ ] Run Lighthouse audit
- [ ] Performance score: _____ (target: >90)
- [ ] Accessibility score: _____ (target: >90)
- [ ] Best Practices score: _____ (target: >90)
- [ ] SEO score: _____ (target: >90)

#### Step 10: Test on Multiple Browsers
- [ ] Chrome: Works correctly
- [ ] Firefox: Works correctly
- [ ] Safari: Works correctly
- [ ] Edge: Works correctly

### Extended Monitoring (1-24 hours)

#### Step 11: Monitor Analytics
- [ ] Go to Netlify Dashboard → Analytics
- [ ] Verify traffic is being tracked
- [ ] Check for any 404 errors
- [ ] Check for any 500 errors
- [ ] Monitor page load times

#### Step 12: Gather User Feedback
- [ ] Admin user tested: Feedback: _______________
- [ ] PAM user tested: Feedback: _______________
- [ ] PDM user tested: Feedback: _______________
- [ ] TPM user tested: Feedback: _______________
- [ ] PSM/TAM user tested: Feedback: _______________

#### Step 13: Verify Netlify Blobs
- [ ] Test partner creation (writes to Blobs)
- [ ] Test partner retrieval (reads from Blobs)
- [ ] Test questionnaire submission (writes to Blobs)
- [ ] Test submission retrieval (reads from Blobs)
- [ ] No storage errors in logs

---

## Configure Monitoring and Alerts

### Netlify Analytics
- [ ] Enable Netlify Analytics (if not already enabled)
- [ ] Configure analytics settings
- [ ] Set up custom events (if needed)

### Error Tracking (Optional)
- [ ] Set up Sentry or similar service
- [ ] Configure error reporting
- [ ] Test error tracking
- [ ] Set up alert notifications

### Uptime Monitoring (Optional)
- [ ] Set up UptimeRobot or similar service
- [ ] Configure uptime checks
- [ ] Set up alert notifications
- [ ] Test alerts

### Performance Monitoring
- [ ] Enable Netlify Lighthouse plugin
- [ ] Configure performance budgets
- [ ] Set up performance alerts

---

## Security Verification

### Security Checklist
- [ ] HTTPS is enforced
- [ ] Security headers are set (check netlify.toml)
- [ ] Authentication is required for all pages
- [ ] Role-based access control is working
- [ ] No sensitive data in client-side code
- [ ] No API keys exposed in frontend
- [ ] CSRF protection is active
- [ ] Input sanitization is working

### Security Audit
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Check for outdated dependencies
- [ ] Review access logs for suspicious activity
- [ ] Verify user permissions are correct

---

## Backup and Recovery

### Backup Plan
- [ ] Document backup procedures
- [ ] Netlify Blobs data backup strategy documented
- [ ] Code repository backed up (Git)
- [ ] Environment variables documented securely

### Recovery Plan
- [ ] Rollback procedure documented
- [ ] Recovery Time Objective (RTO): 4 hours
- [ ] Recovery Point Objective (RPO): 24 hours
- [ ] Emergency contacts documented

---

## Documentation and Training

### Documentation
- [ ] Deployment guide accessible to team
- [ ] User guides available for all roles
- [ ] FAQ document published
- [ ] Troubleshooting guide available
- [ ] User management guide available

### Training
- [ ] Admin training scheduled: _______________
- [ ] PAM training scheduled: _______________
- [ ] PDM training scheduled: _______________
- [ ] TPM training scheduled: _______________
- [ ] PSM/TAM training scheduled: _______________

### Communication
- [ ] Deployment announcement sent
- [ ] User credentials distributed securely
- [ ] Support channel established
- [ ] Feedback mechanism in place

---

## Final Sign-Off

### Deployment Team
- [ ] Technical Lead: _______________ Date: _____
- [ ] QA Lead: _______________ Date: _____
- [ ] Product Owner: _______________ Date: _____
- [ ] Security Team: _______________ Date: _____

### Go-Live Decision
- [ ] All critical items completed
- [ ] All stakeholders approve
- [ ] Launch date confirmed: _______________
- [ ] Rollback plan in place

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Address any critical issues immediately
- [ ] Gather user feedback
- [ ] Plan first iteration improvements

---

## Rollback Procedure (If Needed)

### Immediate Rollback
- [ ] Go to Netlify Dashboard → Deploys
- [ ] Find previous working deployment
- [ ] Click "Publish deploy"
- [ ] Verify site is working
- [ ] Notify users of rollback

### Investigate Issues
- [ ] Document what went wrong
- [ ] Review error logs
- [ ] Identify root cause
- [ ] Plan fix
- [ ] Test fix thoroughly
- [ ] Redeploy when ready

---

## Success Criteria

### Deployment is Successful When:
- [ ] Site is accessible at production URL
- [ ] All users can log in
- [ ] Role-based access control works
- [ ] Partners can be created and managed
- [ ] Questionnaires can be submitted
- [ ] Data persists correctly
- [ ] No critical errors in logs
- [ ] Performance meets targets
- [ ] Security measures are active
- [ ] Users can complete key workflows

---

## Notes and Issues

### Deployment Notes:
```
[Add any notes about the deployment process]
```

### Issues Encountered:
```
[Document any issues and how they were resolved]
```

### Follow-Up Items:
```
[List any items that need attention post-deployment]
```

---

**Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

**Final Deployment URL**: _______________

**Deployment Completed By**: _______________ **Date**: _______________
