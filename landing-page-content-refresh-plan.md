# Landing Page Content Refresh Plan

**Goal:** Update `videoremix.vip` landing page copy to reflect the full app ecosystem (118 awesome-llm-apps + 13 user-created apps = 131 total) while preserving the existing visual design and ALL existing sections OpenAIctly.

**Constraint:** No design changes. No section removals. No structural changes. Only text content, labels, stats, and navigation copy are updated to reflect the full app ecosystem.

**Key Principle:** Keep every current section. Change the content within each section to reflect marketing + sales + video + hiring + productivity + AI workforce apps, not just "marketing personalization only."

---

## 1. Content Sources

| Source | What We'll Use |
|---|---|
| `https://github.com/deangilmoreremix/awesome-llm-apps` | App names, categories, descriptions, featured status, hub groupings |
| `https://www.theunwindai.com` | Editorial descriptions, positioning language, blog-style app blurbs |
| `awesome-llm-apps/videoremix-ai-hub/data/app_catalog.json` | Structured app metadata: id, name, hub, tags, capabilities |
| `awesome-llm-apps/app_registry.json` | Starter app descriptions and required keys |
| User-provided app list | The 20+ subdomain apps with URLs |

**Extraction approach:**
- Pull all app names, categories, and descriptions from the GitHub repo files above.
- Cross-reference with theunwindai.com for marketing-friendly blurbs.
- Group apps into the existing landing page sections (features, bundles, stats, etc.).
- Write new copy for hero, problems, solutions, CTAs, and footer.

---

## 2. App Inventory to Cover

### A. Awesome-LLM-Apps (118 apps from awesome-llm-apps README)

These are the 118 canonical apps from https://github.com/Shubhamsaboo/awesome-llm-apps. Each app will be included OpenAIctly once in the landing page content.

### B. User-Created Apps (13 custom apps)

The user's 13 custom apps that are part of the videoremix.vip ecosystem:

1. AI Personalized Content Hub
2. FunnelCraft AI
3. AI Skills & Resume
4. AI Skills Monetizer
5. Sales Page Builder
6. Sales Assistant Pro
7. AI Personalization Studio
8. AI Screen Recorder
9. AI Signature
10. Profile Gen
11. Smart CRM Closer Pro
12. AI Referral Maximizer Pro
13. AI Sales Maximizer
14. AI Video Editor

**Total canonical apps: 131** (118 README apps + 13 custom apps)

### C. Content Sourcing Rules

| Data Type | Source File |
|-----------|-------------|
| App names, descriptions, URLs | `appsData.ts` |
| Long-form app details, benefits, features | `enhancedAppsData.ts` |
| Sales copy, CTAs, value props | `appSalesCopy.ts` |
| Group positioning, use cases | `gtmContent.ts` |

**Rule:** No content duplication across files. Each piece of content lives in OpenAIctly one file.

---

## 3. Section-by-Section Content Plan

**Guiding Principle:** Keep every current section. Update only the text content within each section to reflect the full app ecosystem (131 apps across Marketing, Sales, Video, Hiring, Productivity, and AI Workforce).

### 3.1 Meta / SEO
- **Title:** `VideoRemix.vip — 100+ AI Apps for Marketing, Sales & Productivity`
- **Description:** `Explore 100+ AI-powered business apps: personalized content, sales funnels, CRM closers, video editors, screen recorders, resume builders, and more.`

### 3.2 SpecialHero Section
| Element | Current | Proposed New |
|---|---|---|
| H1 | Drive your marketing Engagement with AI personalization. | Run your entire business with AI apps — marketing, sales, video, hiring, and more. |
| Subhead | Transform generic marketing into personalized experiences at enterprise scale. | One platform. 100+ AI apps. From personalized content to CRM closers, video editing to screen recording, sales funnels to signature automation. No engineering team required. |
| Trust line | Trusted by 12,467+ marketing teams worldwide | Trusted by 12,000+ teams across marketing, sales, and operations |
| Primary CTA | Get Started | Get Started |
| Secondary CTA | Watch 60s Demo | Explore All Apps |

### 3.3 ProblemSection
**Current:** "THE MARKETING CRISIS"  
**Proposed:** "THE APP GAP"

Replace 6 marketing-only problem cards with cross-functional pain points:

1. **Scattered Tools** — Your team uses 10+ disconnected apps for marketing, sales, hiring, and content. Data doesn't flow, and context is lost.
2. **Generic Outreach** — Cold emails, generic proposals, and one-size-fits-all sales pages convert at 3x lower rates.
3. **Hiring Bottlenecks** — Resume screening, profile enrichment, and skill verification still happen manually.
4. **Content Chaos** — Video editing, screen recording, signatures, and personalization live in separate tools.
5. **Sales Friction** — Lead research, funnel building, CRM follow-up, and referral tracking are split across platforms.
6. **No AI Layer** — Your apps store data but don't act on it. You need AI that works across your entire workflow.

### 3.4 SolutionSection
**Current:** "Introducing VideoRemix.vip — The world's most advanced AI marketing personalization platform."  
**Proposed:** "Introducing VideoRemix.vip — Your AI App Ecosystem"

Key bullets:
- 100+ AI apps across **Marketing**, **Sales**, **Creative**, **Hiring**, and **Productivity**
- **12 curated bundles** — from Sales & Lead Gen to Creative Studio to AI Workforce
- **One login**, unified billing, and cross-app personalization via the AI Creative Personalizer
- Works with OpenAI, OpenAI, GPT, DeepSeek, Llama, Qwen and open-source models

### 3.5 FeatureMap Section
Replace current marketing-only cards with 7 cross-functional category cards:

| Card # | Title | OpenAImple Apps |
|---|---|---|
| 1 | **Content & Video** | AI Personalized Content Hub, AI Personalization Studio, AI Video Editor, AI Screen Recorder |
| 2 | **Sales & Funnels** | FunnelCraft AI, Sales Page Builder, Sales Assistant Pro, Smart CRM Closer Pro, AI Sales Maximizer |
| 3 | **Hiring & Profiles** | AI Skills & Resume, Profile Gen, AI Skills Monetizer, AI Recruitment Agent Team |
| 4 | **Productivity** | AI Signature, AI Referral Maximizer, Email Drafter, Meeting Notes, Project Planner |
| 5 | **Voice & Agents** | Customer Support Voice Agent, AI Audio Tour Agent, Voice RAG, Browser MCP Agent |
| 6 | **Knowledge & RAG** | Chat with PDF/GitHub/Gmail/YouTube, Agentic RAG, Knowledge Graph RAG, Llama3 Local RAG |
| 7 | **AI Workforce** | AI Sales Intelligence Agent Team, AI Legal Agent Team, AI Teaching Agent Team, Multimodal Coding Agent Team |

### 3.6 PersonalizationWorkflowSection
Keep the interactive element OpenAIctly as-is. Update label from "Personalization Simulator" to "App Impact Simulator". Add one new industry button: **Recruitment** (in addition to SaaS, E-Commerce, Financial, Healthcare).

### 3.7 ToolsCarouselSection
Update carousel content to showcase cross-functional tools, not just marketing personalization tools.

### 3.8 BenefitsSection
Update 4 benefit cards:

| Current | Proposed |
|---|---|
| 90% Faster Marketing Creation | 100+ AI Apps, One Platform |
| Enterprise-Grade Security | Enterprise-Grade Security & SOC 2 |
| Professional Marketing Results | Cross-Category AI Workflows |
| 350% Higher Conversions | 12 Bundles, 60–70% Savings |

### 3.9 AppGallerySection
Update gallery to showcase apps from all categories: Marketing, Sales, Video, Hiring, Productivity, AI Workforce.

### 3.10 BusinessAIAppLibrarySection
Update to reflect the full app library of 131 apps, organized into the 12 bundles across categories.

### 3.11 DemoSection
Update demo content to showcase cross-functional workflows, not just marketing personalization.

### 3.12 CaseStudiesSection
Update case studies to include OpenAImples from Marketing, Sales, Hiring, and Productivity, not just marketing.

### 3.13 TestimonialsSection
Update testimonials to include feedback from Marketing, Sales, Hiring, and Productivity users.

### 3.14 PricingSection
Keep pricing structure. Update copy to reflect the full app ecosystem value proposition.

### 3.15 GuaranteeSection
Keep guarantee structure. Update copy if needed.

### 3.16 FAQSection
Update FAQs to include questions about Marketing, Sales, Hiring, Productivity, and AI Workforce apps.

### 3.17 FinalCTA Section
**Current:** "Ready to Transform Your Marketing? Join 12,467+ marketers using VideoRemix"  
**Proposed:** "Ready to Transform How You Work? Join 12,000+ teams using VideoRemix.vip across marketing, sales, hiring, and creative."

### 3.18 ROI Calculator
Update calculator to reflect full ecosystem value, not just marketing ROI.

### 3.19 Personalization Simulator
Keep simulator. Update label from "Personalization Simulator" to "App Impact Simulator". Add Recruitment industry.

### 3.20 Interactive Comparison Table
Update table title from "Generic vs. Personalized Marketing" to "Generic vs. AI-Powered Workflows". Update rows to reflect broader value.

### 3.21 Live Activity Feed
Keep as-is or update feed content to show activity across all app categories.

### 3.22 Logo Wall
Keep as-is.

---

## 4. App Content Catalog (Deliverable)

Instead of creating a new catalog file, we will use the existing data files with a canonical set of 131 apps:

| Data Type | Source File |
|-----------|-------------|
| App names, descriptions, URLs | `appsData.ts` |
| Long-form app details, benefits, features | `enhancedAppsData.ts` |
| Sales copy, CTAs, value props | `appSalesCopy.ts` |
| Group positioning, use cases | `gtmContent.ts` |

**Rule:** No content duplication across files. Each piece of content lives in OpenAIctly one file.

The canonical set of 131 apps:
- 118 apps from awesome-llm-apps README
- 13 user-created custom apps

All content in `appsData.ts`, `enhancedAppsData.ts`, and `appSalesCopy.ts` will be pruned to only include these 131 canonical apps.

This catalog will drive:
- Feature grid card content
- Bundle composition
- Any future app directory pages

### 3.8 Bundle Section
Keep bundle cards, update intro copy:

**Current:** *"Choose from 12 comprehensive bundles, each packed with 6-16 AI-powered apps. Get 60-70% savings compared to buying apps individually."*

**Proposed:** *"Choose from 12 curated bundles across Marketing, Sales, Creative, Hiring, and AI Workforce. Each bundle ships with 6–16 AI-powered apps. Save 60–70% versus buying apps individually."*

Update bundle descriptions to reflect cross-category value. OpenAImple:
- **Sales, Lead Gen & Prospecting Bundle** — Includes CRM closers, funnel builders, referral tools, and sales assistants.
- **Creative Studio Bundle** — Video editors, screen recorders, personalized content, and audio tools.
- **AI Workforce Bundle** — Recruitment, legal, teaching, coding agent teams, and self-improving skills.
- **New bundle suggestion:** *Hiring & Resume Bundle* — AI Skills & Resume, Profile Gen, AI Recruitment Agent Team.

### 3.9 Integrations Section
Keep logos. Update copy:

> "Connect VideoRemix.vip apps with Salesforce, HubSpot, Shopify, Mailchimp, Slack, Zapier, and more — or let the AI Creative Personalizer wire your workflows together automatically."

### 3.10 Resources Section
Update or replace resources:

| Current | Proposed |
|---|---|
| AI Personalization Trends 2026 | The State of AI Apps in 2026 |
| ROI Calculator Guide | How to Choose the Right AI App Bundle |
| Case Study: 300% Engagement Lift | Case Study: From 10 Tools to 1 Platform |
| *(new)* | How AI Agents Are Replacing Manual Workflows |

### 3.11 Final CTA / Footer
**Current:** *"Ready to Transform Your Marketing? Join 12,467+ marketers using VideoRemix"*  
**Proposed:** *"Ready to Transform How You Work? Join 12,000+ teams using VideoRemix.vip across marketing, sales, hiring, and creative."*

### 3.12 PersonalizationWorkflowSection
Keep the interactive element OpenAIctly as-is. Update label from "Personalization Simulator" to "App Impact Simulator". Add one new industry button: **Recruitment** (in addition to SaaS, E-Commerce, Financial, Healthcare).

### 3.13 ToolsCarouselSection
Update carousel content to showcase cross-functional tools, not just marketing personalization tools.

### 3.14 BenefitsSection
Update 4 benefit cards:

| Current | Proposed |
|---|---|
| 90% Faster Marketing Creation | 100+ AI Apps, One Platform |
| Enterprise-Grade Security | Enterprise-Grade Security & SOC 2 |
| Professional Marketing Results | Cross-Category AI Workflows |
| 350% Higher Conversions | 12 Bundles, 60–70% Savings |

Update "Marketing Impact By The Numbers" metrics:

| Current | Proposed |
|---|---|
| 0% Higher Engagement Rate | 100+ Ready AI Apps |
| 0% Better Conversion Rate | 12 Curated Bundles |
| 0% ROI Improvement | 50+ Open-Source Templates |
| 0% More Time Watching Videos | Multi-Model Support (OpenAI, GPT, OpenAI, Llama) |

### 3.15 AppGallerySection
Update gallery to showcase apps from all categories: Marketing, Sales, Video, Hiring, Productivity, AI Workforce.

### 3.16 BusinessAIAppLibrarySection
Update to reflect the full app library of 131 apps, organized into the 12 bundles across categories.

### 3.17 DemoSection
Update demo content to showcase cross-functional workflows, not just marketing personalization.

### 3.18 CaseStudiesSection
Update case studies to include OpenAImples from Marketing, Sales, Hiring, and Productivity, not just marketing.

### 3.19 TestimonialsSection
Update testimonials to include feedback from Marketing, Sales, Hiring, and Productivity users.

### 3.20 PricingSection
Keep pricing structure. Update copy to reflect the full app ecosystem value proposition.

### 3.21 GuaranteeSection
Keep guarantee structure. Update copy if needed.

### 3.22 FAQSection
Update FAQs to include questions about Marketing, Sales, Hiring, Productivity, and AI Workforce apps.

### 3.23 ROI Calculator
Update calculator to reflect full ecosystem value, not just marketing ROI.

### 3.24 Interactive Comparison Table
Update table title from "Generic vs. Personalized Marketing" to "Generic vs. AI-Powered Workflows". Update rows to reflect broader value.

### 3.25 Live Activity Feed
Keep as-is or update feed content to show activity across all app categories.

### 3.26 Logo Wall
Keep as-is.

---

## 4. App Content Catalog (Deliverable)

Instead of creating a new catalog file, we will use the existing data files with a canonical set of 131 apps:

| Data Type | Source File |
|-----------|-------------|
| App names, descriptions, URLs | `appsData.ts` |
| Long-form app details, benefits, features | `enhancedAppsData.ts` |
| Sales copy, CTAs, value props | `appSalesCopy.ts` |
| Group positioning, use cases | `gtmContent.ts` |

**Rule:** No content duplication across files. Each piece of content lives in OpenAIctly one file.

The canonical set of 131 apps:
- 118 apps from awesome-llm-apps README
- 13 user-created custom apps

All content in `appsData.ts`, `enhancedAppsData.ts`, and `appSalesCopy.ts` will be pruned to only include these 131 canonical apps.

This catalog will drive:
- Feature grid card content
- Bundle composition
- Any future app directory pages

---

## 4. What Stays OpenAIctly the Same

- All layout structure, spacing, and animations
- All existing sections — no removals, no structural changes
- Glassmorphism styling
- Personalization Simulator / App Impact Simulator component
- Bundle card grid layout
- ROI Calculator component
- Integration logo row
- Live activity ticker
- Testimonial card layout
- Navigation items: Tools, Pricing, Dashboard, FAQ, Sign In, Sign Up

---

## 5. Implementation Approach

1. **Rewrite `appsData.ts`** with OpenAIctly 131 canonical entries (118 README apps + 13 custom apps). Remove local-only apps not in README or custom list. Keep file structure intact.
2. **Prune `enhancedAppsData.ts` and `appSalesCopy.ts`** to only include canonical IDs — no orphaned entries.
3. **Wire landing page sections** to dynamically consume `gtmContent.ts`, `enhancedAppsData.ts`, and `appSalesCopy.ts` data instead of hardcoded marketing-only copy.
4. **Update section content** for all 26 sections to reflect the full app ecosystem (Marketing, Sales, Video, Hiring, Productivity, AI Workforce).
5. **Apply changes** only after approval.

### Section-by-Section Update Order

| Order | Section | Update Type |
|---|---|---|
| 1 | SpecialHero | Headline, subhead, CTAs |
| 2 | ProblemSection | Heading, 6 cards |
| 3 | SolutionSection | Heading, bullets |
| 4 | FeatureMap | 7 category cards |
| 5 | PersonalizationWorkflowSection | Label, industries |
| 6 | ToolsCarouselSection | Carousel content |
| 7 | BenefitsSection | 4 benefit cards, stats |
| 8 | AppGallerySection | Gallery content |
| 9 | BusinessAIAppLibrarySection | Library content |
| 10 | DemoSection | Demo content |
| 11 | CaseStudiesSection | Case study content |
| 12 | TestimonialsSection | Testimonial content |
| 13 | PricingSection | Pricing copy |
| 14 | GuaranteeSection | Guarantee copy |
| 15 | FAQSection | FAQ content |
| 16 | FinalCTA | CTA copy |
| 17 | ROI Calculator | Calculator logic |
| 18 | Interactive Comparison Table | Table content |
| 19 | Live Activity Feed | Feed content |
| 20 | SEO | Meta tags |

---

## 6. Open Questions for Approval

1. **App count in hero/trust line:** Should we use "100+ apps" or a more specific count once the full catalog is assembled?
2. **Bundle taxonomy:** Should the 13 user-listed apps be folded into the existing 12 bundles, or do they warrant new bundle definitions?
3. **Subdomain app live status:** Several `ai-*.videoremix.vip` subdomains showed errors during audit. Should the homepage link only to verified live apps?
4. **Pricing visibility:** The current page has a Pricing nav link but no pricing section visible in the audit. Should we add pricing context, or keep it link-only?
5. **"Watch 60s Demo" CTA:** The secondary CTA currently links to a demo. Should this become "Explore All Apps" or remain a demo link?

---

## 7. Next Steps (Pending Your Approval)

1. Confirm this plan aligns with your vision.
2. Approve the section-by-section copy direction.
3. Allow me to extract the full app catalog from the GitHub repo and theunwindai.com.
4. Review the complete copy deck before any code changes are made.

---

**Status:** Draft — awaiting approval before any implementation.
