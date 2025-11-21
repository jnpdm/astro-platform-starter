# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Partner Onboarding Hub to Netlify.

## Prerequisites

### Required Accounts and Access

- [ ] Netlify account with appropriate permissions
- [ ] Access to the GitHub repository (if using Git-based deployment)
- [ ] Netlify CLI installed locally (optional but recommended)

### Required Tools

- Node.js v18.20.8 or higher
- npm v9.0.0 or higher
- Git (for version control)
- Netlify CLI (optional): `npm install -g netlify-cli`

## Initial Setup

### 1. Create Netlify Site

#### Option A: Using Netlify Dashboard

1. Log in to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, Bitbucket)
4. Select the repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18.20.8
6. Click "Deploy site"

#### Option B: Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize new site
netlify init

# Follow the prompts to:
# - Create a new site or link to existing
# - Configure build settings
# - Set up continuous deployment
```

### 2. Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

```
NETLIFY_BLOBS_CONTEXT=production
AUTH_ENABLED=true
```

### 3. Enable Netlify Identity

1. Go to Site Settings → Identity
2. Click "Enable Identity"
3. Configure settings:
   - **Registration**: Invite only (recommended)
   - **External providers**: Disable (use email only)
   - **Email templates**: Customize if needed

### 4. Add Users

**Important**: ⚠️ No test users are pre-created. You must create all users manually.

1. Go to Identity → Invite users
2. Enter email addresses
3. Users will receive invitation emails
4. After users sign up, add role metadata:
   ```json
   {
     "role": "PAM"
   }
   ```
   (Replace "PAM" with appropriate role: PDM, TPM, PSM, TAM, or Admin)

**Recommended Initial Users**:
- 1 Admin user (full system access)
- 1-2 PAM users (partner account managers)
- 1-2 PDM users (partner development managers)
- 1 TPM user (technical partner manager)
- 1 PSM/TAM user (partner success/technical account manager)

**For detailed instructions**, see [User Management Guide](USER-MANAGEMENT-GUIDE.md)

### 5. Enable Netlify Blobs

Netlify Blobs is automatically enabled for sites. Verify in:
- Site Settings → Blobs
- Should show "Enabled"

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

**Setup**: Connect your Git repository to Netlify

**Process**:
1. Push code to main branch
2. Netlify automatically builds and deploys
3. Receive notification when complete
4. Deploy previews created for pull requests

**Advantages**:
- Fully automated
- Deploy previews for testing
- Easy rollback
- Audit trail

### Method 2: Manual Deployment via CLI

**Setup**: Install Netlify CLI and link site

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to site
netlify link
```

**Deploy to Draft**:
```bash
# Build the project
npm run build

# Deploy to draft URL
netlify deploy

# Test the draft deployment
# Visit the provided URL
```

**Deploy to Production**:
```bash
# Deploy to production
netlify deploy --prod
```

**Advantages**:
- Full control over deployment timing
- Test before production
- Good for hotfixes

### Method 3: Manual Deployment via Dashboard

**Process**:
1. Build locally: `npm run build`
2. Go to Netlify Dashboard → Deploys
3. Drag and drop the `dist` folder
4. Wait for deployment to complete

**Advantages**:
- No CLI required
- Simple for one-off deployments

**Disadvantages**:
- Manual process
- No version control integration
- Not recommended for production

## Deployment Workflow

### Standard Deployment Process

1. **Development**
   ```bash
   # Create feature branch
   git checkout -b feature/my-feature
   
   # Make changes
   # ...
   
   # Test locally
   npm run dev
   npm test
   npm run test:integration
   
   # Commit changes
   git add .
   git commit -m "Add my feature"
   
   # Push to remote
   git push origin feature/my-feature
   ```

2. **Pull Request**
   - Create pull request on GitHub
   - Netlify creates deploy preview
   - Review changes on preview URL
   - Run tests on preview
   - Request code review

3. **Merge and Deploy**
   ```bash
   # Merge to main branch
   git checkout main
   git pull origin main
   
   # Netlify automatically deploys to production
   ```

4. **Verify Deployment**
   - Check deployment status in Netlify Dashboard
   - Visit production URL
   - Verify functionality
   - Monitor for errors

### Hotfix Deployment Process

For urgent fixes that need to bypass normal workflow:

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/critical-fix
   ```

2. **Make Fix**
   - Make minimal changes
   - Test thoroughly locally

3. **Deploy via CLI**
   ```bash
   # Build
   npm run build
   
   # Deploy to draft for testing
   netlify deploy
   
   # Test draft deployment
   # ...
   
   # Deploy to production
   netlify deploy --prod
   ```

4. **Merge Back**
   ```bash
   # Create PR to merge hotfix back to main
   git push origin hotfix/critical-fix
   ```

## Environment Configuration

### Development Environment

**Local Development**:
```bash
# .env.development
NETLIFY_BLOBS_CONTEXT=dev
AUTH_ENABLED=false
DEBUG=true
```

**Commands**:
```bash
npm run dev
```

### Staging Environment

**Configuration**:
```
NETLIFY_BLOBS_CONTEXT=staging
AUTH_ENABLED=true
DEBUG=true
```

**Deployment**:
```bash
# Deploy to staging branch
git push origin staging

# Or deploy manually
netlify deploy --alias staging
```

### Production Environment

**Configuration**:
```
NETLIFY_BLOBS_CONTEXT=production
AUTH_ENABLED=true
DEBUG=false
```

**Deployment**:
```bash
# Automatic via main branch
git push origin main

# Or manual
netlify deploy --prod
```

## Post-Deployment Tasks

### Immediate Verification (0-15 minutes)

1. **Check Deployment Status**
   - Netlify Dashboard → Deploys
   - Verify "Published" status
   - Note deployment time and commit

2. **Verify Site Loads**
   - Visit production URL
   - Check all main pages load
   - Verify no console errors

3. **Test Authentication**
   - Log in with test account
   - Verify role-based access
   - Test logout

4. **Test Core Functionality**
   - Create test partner
   - Submit test questionnaire
   - Verify data saves
   - Check reports load

### Short-Term Monitoring (15 minutes - 1 hour)

1. **Monitor Error Rates**
   - Netlify Analytics → Errors
   - Check for spike in errors
   - Investigate any new errors

2. **Check Performance**
   - Netlify Analytics → Performance
   - Verify page load times acceptable
   - Check for performance regressions

3. **Review Logs**
   - Netlify Functions → Logs
   - Check for errors or warnings
   - Verify API calls succeeding

### Extended Monitoring (1-24 hours)

1. **User Feedback**
   - Monitor support channels
   - Check for user-reported issues
   - Respond to feedback

2. **Usage Metrics**
   - Track user adoption
   - Monitor feature usage
   - Identify any issues

3. **Performance Trends**
   - Review performance over time
   - Check for degradation
   - Optimize if needed

## Rollback Procedures

### Automatic Rollback via Netlify

1. Go to Netlify Dashboard → Deploys
2. Find previous successful deployment
3. Click "..." menu → "Publish deploy"
4. Confirm rollback
5. Verify site is working

### Rollback via CLI

```bash
# List recent deployments
netlify deploy:list

# Rollback to specific deployment
netlify rollback
```

### Rollback via Git

```bash
# Revert to previous commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

## Monitoring and Alerts

### Netlify Analytics

**Enable**:
- Site Settings → Analytics
- Enable Netlify Analytics

**Monitor**:
- Page views
- Unique visitors
- Top pages
- Error rates
- Performance metrics

### Error Tracking

**Setup External Service** (optional):
- Sentry
- Rollbar
- Bugsnag

**Configure**:
- Add error tracking SDK
- Set up error alerts
- Configure error grouping

### Uptime Monitoring

**Setup External Service** (recommended):
- UptimeRobot
- Pingdom
- StatusCake

**Configure**:
- Monitor production URL
- Check interval: 5 minutes
- Alert on downtime
- Alert contacts

### Performance Monitoring

**Netlify Lighthouse Plugin**:
- Automatically runs on each deploy
- Reports in deploy logs
- Track performance over time

**Custom Monitoring**:
- Set up custom performance tracking
- Monitor key user journeys
- Track Core Web Vitals

## Backup and Recovery

### Data Backup

**Netlify Blobs Backup**:
```bash
# Export all blobs (custom script needed)
netlify blobs:list --json > backup.json
```

**Backup Schedule**:
- Daily automated backups
- Retain for 30 days
- Store in secure location

### Disaster Recovery

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours

**Recovery Steps**:
1. Assess damage
2. Restore from backup
3. Verify data integrity
4. Test functionality
5. Resume operations

## Security Considerations

### Pre-Deployment Security Checklist

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Verify authentication is enabled
- [ ] Check security headers configured
- [ ] Ensure HTTPS enforced
- [ ] Verify input validation on all forms
- [ ] Check for exposed secrets
- [ ] Review access controls

### Post-Deployment Security

- [ ] Monitor for security alerts
- [ ] Review access logs
- [ ] Check for unusual activity
- [ ] Update dependencies regularly
- [ ] Conduct security audits

## Troubleshooting Deployments

### Build Failures

**Symptoms**: Build fails in Netlify

**Common Causes**:
- Dependency installation failure
- TypeScript errors
- Test failures
- Out of memory

**Solutions**:
1. Check build logs in Netlify
2. Reproduce locally: `npm run build`
3. Fix errors
4. Push fix
5. Retry deployment

### Deploy Failures

**Symptoms**: Build succeeds but deploy fails

**Common Causes**:
- Invalid redirects
- Missing files
- Configuration errors

**Solutions**:
1. Check deploy logs
2. Verify netlify.toml configuration
3. Check file paths
4. Test locally with `npm run preview`

### Runtime Errors

**Symptoms**: Site deploys but has errors

**Common Causes**:
- Environment variables not set
- API endpoints not working
- Netlify Blobs not configured

**Solutions**:
1. Check browser console
2. Verify environment variables
3. Test API endpoints
4. Check Netlify Functions logs

## Best Practices

### Deployment Best Practices

1. **Test Before Deploying**
   - Run all tests locally
   - Test in staging environment
   - Verify on deploy preview

2. **Deploy During Low Traffic**
   - Schedule deployments
   - Avoid peak hours
   - Communicate downtime

3. **Monitor After Deployment**
   - Watch for errors
   - Check performance
   - Respond to issues quickly

4. **Use Feature Flags**
   - Deploy code without activating
   - Test in production safely
   - Gradual rollout

5. **Document Changes**
   - Write clear commit messages
   - Update changelog
   - Create release notes

### Git Workflow Best Practices

1. **Use Feature Branches**
   - One feature per branch
   - Descriptive branch names
   - Regular commits

2. **Write Good Commit Messages**
   - Clear and descriptive
   - Reference issues
   - Explain why, not just what

3. **Code Review**
   - All changes reviewed
   - Use pull requests
   - Address feedback

4. **Keep Main Branch Stable**
   - Only merge tested code
   - Main branch always deployable
   - Fix broken builds immediately

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/netlify/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Deployment Checklist](./DEPLOYMENT-CHECKLIST.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Support

For deployment issues:
- Check [Netlify Status](https://www.netlifystatus.com/)
- Review [Netlify Support](https://www.netlify.com/support/)
- Contact internal DevOps team
- Escalate to Netlify support if needed
