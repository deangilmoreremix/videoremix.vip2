# AI Thumbnails Maintenance Guidelines

## Routine Maintenance

### Weekly Checks
- [ ] Run thumbnail validation script: `npm run validate-thumbnails`
- [ ] Check Supabase storage usage and costs
- [ ] Review any failed generation logs
- [ ] Verify all app thumbnails load in dashboard

### Monthly Reviews
- [ ] Audit thumbnail quality and relevance
- [ ] Update app specifications if features change
- [ ] Review API usage and optimize costs
- [ ] Check for new apps requiring thumbnails

## Adding New Apps

### Process
1. **Define Specifications**
   ```typescript
   {
     appId: 'new-app-id',
     appName: 'New App Name',
     description: 'Clear, descriptive purpose',
     category: 'appropriate-category',
     keyFeatures: ['feature1', 'feature2', 'feature3'],
     targetSize: { width: 800, height: 600 }
   }
   ```

2. **Add to Specifications**
   - Edit `src/data/appThumbnailSpecs.ts`
   - Follow existing naming conventions
   - Ensure category matches dashboard categories

3. **Generate Thumbnail**
   ```bash
   npm run generate-thumbnails
   ```

4. **Validate Integration**
   ```bash
   npm run validate-thumbnails
   npm run test  # Check dashboard renders correctly
   ```

## Updating Existing Thumbnails

### When to Update
- App functionality significantly changes
- New key features added
- Visual inconsistencies identified
- Quality improvements available

### Update Process
1. **Modify Specifications** in `appThumbnailSpecs.ts`
2. **Delete Old Thumbnail** from Supabase storage
3. **Remove from Cache** in `generatedThumbnails.ts`
4. **Regenerate** using batch script
5. **Validate** new thumbnail quality

## Troubleshooting Common Issues

### Generation Failures
- **API Rate Limits**: Wait and retry, check usage dashboard
- **Invalid Prompts**: Review and refine prompt structure
- **Storage Errors**: Verify Supabase permissions and bucket access
- **Network Issues**: Check internet connectivity and API endpoints

### Quality Issues
- **Unrealistic Images**: Refine prompt specificity and style guidelines
- **Wrong Features**: Update keyFeatures array with accurate descriptions
- **Poor Composition**: Adjust prompt structure and category styling
- **Inconsistent Style**: Review and update design philosophy guidelines

### Integration Problems
- **Missing Thumbnails**: Check app ID matches between specs and appsData
- **Broken URLs**: Verify Supabase storage configuration
- **Loading Errors**: Check network and CDN status
- **Fallback Issues**: Ensure original images remain accessible

## Performance Optimization

### API Usage
- Monitor OpenAI API costs monthly
- Optimize batch sizes based on rate limits
- Cache successful generations to avoid duplicates
- Use development mode for testing

### Storage Management
- Regularly clean up unused thumbnails
- Compress images without quality loss
- Monitor Supabase storage usage
- Implement CDN caching strategies

### Dashboard Performance
- Lazy load thumbnails in components
- Implement proper error boundaries
- Cache thumbnail URLs in app data
- Optimize image formats for web

## Emergency Procedures

### Complete System Failure
1. **Switch to Fallbacks**: All apps revert to original Unsplash images
2. **Check API Status**: Verify OpenAI and Supabase service availability
3. **Review Logs**: Analyze error patterns and causes
4. **Manual Generation**: Generate critical thumbnails individually if needed

### Data Loss Recovery
1. **Check Backups**: Restore from version control if available
2. **Regenerate Batch**: Run full generation script
3. **Validate Coverage**: Ensure all apps have thumbnails
4. **Update Integration**: Refresh app data mappings

## Cost Management

### Budget Guidelines
- OpenAI API: Monitor monthly usage against budget
- Supabase Storage: Track GB stored and transfer costs
- Set alerts for unexpected cost increases

### Optimization Strategies
- Generate only when needed (new apps, quality issues)
- Use appropriate image sizes and quality settings
- Implement thumbnail reuse for similar apps
- Regular cleanup of unused assets

## Quality Assurance

### Automated Checks
- File size validation (>10KB)
- Image format verification (PNG)
- URL accessibility testing
- Loading performance monitoring

### Manual Reviews
- Visual consistency across categories
- Functional representation accuracy
- Professional appearance standards
- Mobile responsiveness verification