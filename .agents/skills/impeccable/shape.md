# Shape Design Brief: VideoRemix.vip Million-Dollar SaaS Landing Page

## Task-Specific Brief (Confirmed)

**Feature**: Complete 24-section million-dollar SaaS landing page for VideoRemix.vip
**Register**: Brand (landing page IS the product showcase)

## Scope & Content/States

### Sections (24 total)
1. **Hero Section** - Headline, subheadline, dual CTAs, trust signals
2. **Problem/Solution** - Generic vs personalized marketing contrast
3. **Features & Capabilities** - AI personalization, scale, analytics
4. **Product Tour** - Interactive 4-step demo workflow
5. **Use Cases** - E-commerce, B2B sales, customer onboarding
6. **Pricing** - Tiered model with bundle offers
7. **Testimonials** - Customer success stories with metrics
8. **FAQ** - Top 10 questions
9. **Security & Compliance** - Enterprise-grade certifications
10. **Integrations** - CRM, marketing, e-commerce, analytics, data
11. **Blog/Resources** - Educational content hub
12. **Footer** - Quick links and legal
13. **Final CTA** - Conversion-focused closing section

### Additional Premium Sections (12)
14. **Transformation Section** - Before/after visualization
15. **Personalization Simulator** - Interactive AI demo
16. **Deep Benefits** - Alternating blocks with metrics
17. **Mid-Page CTA** - Strategic conversion point
18. **ROI Calculator** - Interactive financial impact tool
19. **What's Included** - Feature breakdown
20. **Marketing Impact Statistics** - Data-driven results
21. **Logo Wall** - Customer showcase
22. **Interactive Comparison Table** - Detailed feature comparison
23. **See It In Action** - Video demo showcase
24. **Floating UI Elements** - Live activity feed, progress indicators

### States to Cover
- Default (all sections visible)
- Loading states (skeletons for lazy-loaded sections)
- Hover states (cards, buttons, interactive elements)
- Focus states (keyboard navigation)
- Mobile/tablet/desktop responsive variants

## Visual Direction

### Reference
**Stripe** - Premium brand with confident restraint, sophisticated color strategy, clean typography, purposeful motion.

### Color Strategy
- **Committed** - Indigo carries 40% of surface, pink as action color for marketing emphasis
- Primary: `#4f46e5` (Indigo-600)
- Secondary: `#ec4899` (Pink-500) - Marketing/action emphasis
- Accent: `#8b5cf6` (Violet-400) - AI/technical elements
- Success: `#10b981` (Emerald-500) - Results/metrics
- Neutrals: Tinted dark grays (`#050510` to `#1e1b4a`)

### Typography
- Font: Inter (already loaded)
- Modular scale (1.25 ratio): Hero clamp(2.5rem, 5vw, 4.5rem)
- Body: 1rem (16px) with 1.6 line-height
- Maximum 65ch line length

### Motion
- Entrance: Staggered reveals on page load
- Hover: Subtle transforms (0.3s ease)
- Floating elements: 6s ease-in-out infinite
- Gradient shifts: 10s ease infinite
- Respect `prefers-reduced-motion`

### Layout
- Dark theme with purple/blue/cyan gradients
- Glassmorphism cards (premium features)
- Floating notifications
- Animated particles
- Asymmetric compositions (not centered stacks)

## Constraints
- Must use existing premium components
- Must load sections lazily with Suspense
- Must be semantic HTML with proper accessibility
- Must be responsive across all viewports
- No side-stripe borders (absolute ban)
- No gradient text (absolute ban)
- No identical card grids (absolute ban)

## Anti-Goals
- No cute mascots or bubble letters
- No gradient-heavy "modern startup" aesthetics
- No stock photo libraries with fake people
- No generic SaaS-cream defaults
- No template-looking designs

## Probes When
Image generation available - generate 1-3 high-fidelity north-star comps showing:
- Hero section with before/after personalization demo
- Product tour workflow visualization
- Pricing section with tier comparison

## Image Gate Decision
**SKIPPED** - Harness lacks native image generation capability. Proceed with code-first implementation using existing component structure.

## North-Star Mock Decision
**SKIPPED** - Existing LandingPage.tsx structure serves as the visual reference. Focus on refinement and completion.

## Implementation Notes
- Replace all "Maigret" references with "VideoRemix Personalization System™"
- Ensure all 116+ apps and 12 bundles data is accessible
- Add proper SEO meta tags
- Implement loading skeletons for Suspense boundaries