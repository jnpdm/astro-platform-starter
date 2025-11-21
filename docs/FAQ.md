# Frequently Asked Questions (FAQ)

## General Questions

### What is the Kuiper Partner Onboarding Hub?
The Kuiper Partner Onboarding Hub is an internal platform for sales teams to manage the structured partner onboarding journey. It implements a gated process with three critical readiness gates (Ready to Sell, Ready to Order, Ready to Deliver) and tracks partners through a 120-day journey from pre-contract engagement through post-launch operations.

### Who can access the hub?
The hub is accessible to internal team members with assigned roles:
- **PAM** (Partner Account Manager) - Full access to owned partners
- **PDM** (Partner Development Manager) - Pre-Contract through Gate 1
- **TPM** (Technical Partner Manager) - Gate 2 access
- **PSM** (Partner Success Manager) - Gate 3 and Post-Launch
- **TAM** (Technical Account Manager) - Gate 3 and Post-Launch
- **Admin** - Full access to all partners and features

### How do I log in?
Use your company email and password through Netlify Identity. If you don't have an account, contact your administrator.

### How do I get an account?
Your administrator must invite you through the Netlify Identity dashboard. You'll receive an invitation email with a link to set your password. See the [User Management Guide](USER-MANAGEMENT-GUIDE.md) for details.

### What browsers are supported?
The hub works best on:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

Mobile browsers are supported for viewing, but questionnaire completion is optimized for desktop/tablet.

## Partner Management

### How do I create a new partner?
1. Navigate to the Dashboard
2. Click "Add New Partner"
3. Fill in required information (name, tier, CCV, contract type)
4. Assign team members
5. Click "Create Partner"

Only PAMs and Admins can create new partners.

### What are the partner tiers?
- **Tier 0**: CCV ≥ $50M (automatically qualifies for Gate 0)
- **Tier 1**: Strategic partners (CCV ≥ 10% of Country LRP)
- **Tier 2**: Standard partners

### Can I change a partner's tier?
Yes, but only Admins can modify partner tier classification. Contact your administrator if a tier change is needed.

### How do I assign team members to a partner?
From the partner detail page, click "Edit Partner" and update the team assignments (PDM, TPM, PSM, TAM). PAMs are assigned at partner creation.

### What happens if a team member leaves?
Contact an Admin to reassign the partner to a new team member. All historical data and submissions remain intact.

## Questionnaires

### How many questionnaires are there?
There are 5 questionnaires:
1. **Pre-Contract PDM Engagement** (5 sections)
2. **Gate 0: Onboarding Kickoff** (6 sections)
3. **Gate 1: Ready to Sell** (3 phases)
4. **Gate 2: Ready to Order** (2 phases)
5. **Gate 3: Ready to Deliver** (2 phases)

### Can I save a questionnaire and complete it later?
Yes! The system auto-saves your progress every 30 seconds. You can also manually save by clicking "Save Draft". Your progress is stored locally in your browser and on the server.

### What if I lose my draft?
Drafts are saved both locally (in your browser) and on the server. If you clear your browser cache, the server copy will be restored when you return to the questionnaire.

### Can I edit a submitted questionnaire?
No, once a questionnaire is submitted and signed, it becomes read-only. If you need to make changes, contact an Admin who can create a new version.

### What does "section status" mean?
Each questionnaire section is evaluated as:
- **PASS** (🟢) - All criteria met
- **FAIL** (🔴) - Criteria not met (see failure reasons)
- **PENDING** (🟡) - Not yet evaluated

Section statuses are visible internally but not shared with partners.

### Why can't I submit my questionnaire?
Common reasons:
- Required fields are not filled
- Validation errors exist (check for red borders)
- Signature is not captured
- You're not logged in
- Network connection issue

Check the error messages and ensure all sections are complete.

## Gate Progression

### What are the gates?
The onboarding journey has 5 gates:
1. **Pre-Contract** - PDM engagement qualification
2. **Gate 0** - Onboarding kickoff readiness
3. **Gate 1** - Ready to Sell (Weeks 1-12)
4. **Gate 2** - Ready to Order (Weeks 13-17)
5. **Gate 3** - Ready to Deliver (Weeks 18-20)
6. **Post-Launch** - Ongoing operations

### Can a partner skip a gate?
No, gates must be completed sequentially. A partner cannot progress to the next gate until the previous gate is passed.

### What happens if a partner fails a gate?
If a gate fails, the partner is blocked from progressing. The failure reasons are displayed, and the team must address the issues before resubmitting.

### How long does each gate take?
Estimated timelines:
- Pre-Contract: Ongoing (10-15 PDM hours/week)
- Gate 0: Prerequisite validation
- Gate 1: 12 weeks (Phases 1A, 1B, 1C)
- Gate 2: 5 weeks (Phases 2A, 2B)
- Gate 3: 3 weeks (Phases 3A, 3B)

Total: ~120 days from contract signature to launch.

### Can an Admin override a gate failure?
Yes, Admins have override capabilities, but this should be used sparingly and documented with clear justification.

### What is the "Financial Bar" for Gate 0?
Tier 0 partners (CCV ≥ $50M) automatically meet the financial bar. Other partners must meet at least 4 of 6 criteria to qualify for white-glove onboarding support.

## Signatures

### Why do I need to sign questionnaires?
Digital signatures provide accountability and create an audit trail for gate approvals. They capture who submitted the questionnaire and when.

### What signature modes are available?
- **Typed Signature**: Enter your name and email
- **Drawn Signature**: Draw your signature with mouse or touch

Both modes are legally equivalent for internal purposes.

### What information is captured with my signature?
- Signer name
- Signer email
- Timestamp
- IP address
- User agent (browser information)

This metadata ensures audit compliance.

### Can I change my signature after submitting?
No, signatures are immutable once submitted. This ensures the integrity of the audit trail.

### What if the signature capture isn't working?
Try these steps:
1. Switch between typed and drawn modes
2. Ensure your email is filled in
3. Try a different browser
4. Clear browser cache
5. Use typed signature as a reliable fallback

## Role-Based Access

### What can PAMs access?
PAMs have full access to all partners they own, across all gates. They can create partners, submit questionnaires, and view all reports.

### What can PDMs access?
PDMs can access partners in Pre-Contract through Gate 1 (Ready to Sell). They focus on early-stage onboarding and GTM strategy.

### What can TPMs access?
TPMs can access partners in Gate 2 (Ready to Order). They focus on technical integration and API implementation.

### What can PSMs/TAMs access?
PSMs and TAMs can access partners in Gate 3 (Ready to Deliver) and Post-Launch. They focus on operational readiness and ongoing support.

### What can Admins access?
Admins have unrestricted access to all partners, all gates, and all administrative functions.

### Can I access a partner I'm not assigned to?
No, unless you're an Admin. Access is restricted to assigned team members to maintain data security and privacy.

### How do I request access to a partner?
Contact the partner's PAM or an Admin to be added to the partner's team.

## Documentation

### Where can I find documentation?
Click "Documentation" in the navigation menu. Documentation is organized by gate, phase, and role.

### Can I search the documentation?
Yes, use the search box in the Documentation Hub to find specific topics.

### How do I know which documentation applies to me?
The system automatically filters documentation based on your role. You can also filter by gate and phase.

### What if a documentation link is broken?
Report broken links to your administrator. They can update the documentation configuration.

### Can I suggest new documentation?
Yes! Submit suggestions through your support channel or directly to your administrator.

## Reports and Analytics

### What reports are available?
- Partner distribution by gate
- Gate completion rates
- Average time per gate
- Gate pass/fail rates
- PDM capacity utilization
- Partners at risk of missing launch dates

### Can I export report data?
Yes, click "Export to CSV" on the Reports page to download data for further analysis.

### How often are reports updated?
Reports are updated in real-time as questionnaires are submitted and gates are completed.

### Can I create custom reports?
Not currently, but you can export data to CSV and create custom reports in Excel or other tools.

### Who can access reports?
All users can access reports, but the data shown is filtered based on role and partner assignments.

## Technical Issues

### The page won't load
1. Check your internet connection
2. Verify you're logged in
3. Try refreshing the page (Ctrl/Cmd + R)
4. Clear browser cache
5. Try a different browser
6. Contact support if issue persists

### I'm getting an error message
1. Read the error message carefully
2. Check the troubleshooting guide
3. Try the suggested fix
4. Take a screenshot of the error
5. Contact support with details

### My data isn't saving
1. Check internet connection
2. Verify you're still logged in (session may have expired)
3. Check browser console for errors (F12)
4. Try manually saving
5. Contact support if issue persists

### The signature capture isn't working
1. Ensure you're using a supported browser
2. Try switching between typed and drawn modes
3. Check that JavaScript is enabled
4. Try disabling browser extensions
5. Use typed signature as a fallback

### I can't access a feature
1. Verify your role has permission for this feature
2. Check that you're assigned to the partner
3. Ensure the previous gate is completed (for gate progression)
4. Contact your administrator if you need additional access

## Data and Privacy

### Where is my data stored?
All data is stored securely in Netlify Blobs, which provides encryption at rest and in transit.

### Who can see my submissions?
Only team members assigned to the partner and Admins can view submissions. Data is not shared externally.

### Can I delete a submission?
Only Admins can delete submissions. This maintains audit trail integrity.

### How long is data retained?
Data is retained indefinitely for audit and compliance purposes. Contact your administrator for specific retention policies.

### Is my data backed up?
Yes, Netlify provides automatic backups. Contact your administrator for backup and recovery procedures.

## Training and Support

### Where can I get training?
Training materials are available in the `docs/user-guides/` directory. Contact your administrator to schedule role-specific training sessions.

### Is there a quick start guide?
Yes, see the [Quick Reference Guide](QUICK-REFERENCE.md) for common tasks and workflows.

### How do I report a bug?
Contact your support channel with:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and device information

### How do I request a new feature?
Submit feature requests through your designated process. Include:
- Use case description
- Expected benefit
- Priority level
- Examples or mockups (if applicable)

### Who do I contact for help?
- **Technical Issues**: Support channel or IT help desk
- **Access Issues**: Your administrator
- **Training**: Your team lead or administrator
- **Feature Requests**: Product owner or administrator

## Best Practices

### How often should I update partner status?
Update partner status at least weekly, or whenever significant milestones are reached.

### Should I complete questionnaires all at once?
No, it's better to complete sections as the work is done. Use the auto-save feature to preserve progress.

### How do I ensure data quality?
- Enter accurate information
- Fill all required fields
- Use consistent formats
- Review before submitting
- Document decisions in notes fields

### What if I'm unsure about a questionnaire answer?
Consult with your team members, reference the documentation, or contact your administrator for guidance.

### How can I speed up the onboarding process?
- Complete questionnaires promptly
- Address blockers early
- Communicate with team members
- Reference documentation proactively
- Learn from previous successful onboardings

---

**Still have questions?** Contact your support channel or administrator.

**Last Updated**: [Date]
**Version**: 1.0.0
