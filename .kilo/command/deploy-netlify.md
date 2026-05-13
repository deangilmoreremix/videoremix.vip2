---
description: Fully automated Netlify deployment with verification
agent: netlify-deploy
---
Execute comprehensive automated Netlify deployment:

1. **Pre-deployment Checks:**
   - Validate environment and dependencies
   - Run linting and tests
   - Check build configuration

2. **Authentication & Setup:**
   - Verify Netlify CLI authentication
   - Confirm site linking
   - Validate API token availability

3. **Build & Deploy:**
   - Execute build process
   - Deploy to Netlify (production or preview)
   - Monitor deployment progress

4. **Verification:**
   - Check deployment status
   - Validate site accessibility
   - Run post-deployment tests

5. **Notification & Cleanup:**
   - Send deployment notifications
   - Clean up temporary files
   - Log deployment results

**USAGE:** /deploy-netlify [environment] [options]

**ENVIRONMENTS:**
- production (default)
- preview
- branch-deploy

**OPTIONS:**
- --dry-run: Preview deployment without executing
- --rollback: Rollback to previous version
- --force: Force deployment ignoring warnings