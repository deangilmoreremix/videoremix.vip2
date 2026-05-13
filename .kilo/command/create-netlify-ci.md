---
description: Create GitHub Actions workflow for Netlify deployment
agent: netlify-deploy
---
Generate automated CI/CD pipeline for Netlify:

1. **Workflow Creation:**
   - Create .github/workflows directory
   - Generate netlify-deploy.yml workflow file
   - Configure triggers (push, pull request, manual)

2. **Build Configuration:**
   - Set up Node.js environment
   - Install dependencies
   - Run tests and linting
   - Build application

3. **Netlify Deployment:**
   - Configure Netlify CLI authentication
   - Deploy to production or preview
   - Handle different deployment contexts

4. **Quality Gates:**
   - Test execution and validation
   - Build artifact verification
   - Deployment status confirmation

5. **Notification & Monitoring:**
   - Deployment success/failure notifications
   - Build status reporting
   - Rollback procedures

**USAGE:** /create-netlify-ci

**FEATURES:**
- Automatic deployment on main branch push
- Preview deployments on pull requests
- Manual deployment trigger
- Build caching and optimization
- Error handling and recovery