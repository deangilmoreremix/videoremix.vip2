# Apps Inventory - Source of Truth

## Summary
- **Last Updated**: 2026-05-14
- **Total Apps**: 116
- **Standard Apps**: 101 ($97 lifetime)
- **Premium Apps**: 15 ($197 lifetime)

## Pricing Structure
| Tier | Price | Description |
|------|-------|-------------|
| Standard | $97 | Base ai-design-studio price |
| Premium | $197 | 15 premium apps with enhanced features |
| Bundle | $397 | 12 category bundles (10 apps each) |

## Premium Apps (15 total, $197)

### Sales & Personalizer Apps
1. ai-personalized-content
2. ai-strategy-advisor-pro
3. ai-sales-email-writer-maximizer
4. ai-content-creator-pro-pro
5. ai-documentation-writer-generator
6. personalizer-transformer
7. personalizer-url-templates
8. competitor-spy-ai-generator
9. sales-assistant-platform
10. sales-call-follow-up-ai-pro

### Media & Content Apps
11. ai-screen-recorder
12. lead-research-scraper-ai-pro
13. ai-business-growth-consultant-pro
14. daily-content-engine-ai-pro

**Total Premium Apps: 15**

## Standard Apps (101 total, $97)

Organized by category. See `appsData.ts` for full list with IDs, names, and descriptions.

### Categories with Standard Apps
- rag-knowledgebase: 13 apps
- sales-lead-gen: 10 apps  
- content-marketing: 10 apps
- coding-developer: 10 apps
- video-audio-voice: 9 apps
- productivity-personal: 9 apps
- research-education: 8 apps
- realestate-local: 7 apps
- finance-business: 7 apps
- legal-compliance: 6 apps
- hr-hiring: 6 apps
- design-uiux: 6 apps
- sales: 5 apps (non-premium)
- video: 2 apps (non-premium)
- lead-gen: 1 ai-design-studio
- ai-image: 1 ai-design-studio
- page: 1 ai-design-studio

**Total Standard Apps: 101**

## Bundle Pricing
Each category bundle contains 10 apps for $397:
- sales-lead-gen-bundle
- content-marketing-bundle
- video-audio-voice-bundle
- rag-knowledgebase-bundle
- realestate-local-bundle
- hr-hiring-bundle
- finance-business-bundle
- legal-compliance-bundle
- coding-developer-bundle
- design-uiux-bundle
- research-education-bundle
- productivity-personal-bundle

## Verification Commands
```bash
# Count total apps
grep -c 'id: "' src/data/appsData.ts

# Count premium apps
awk '/premium: true/' src/data/appsData.ts | wc -l

# Count by category
grep -E "^\s+category:" src/data/appsData.ts | sed 's/.*category: "\([^"]*\)".*/\1/' | sort | uniq -c
```