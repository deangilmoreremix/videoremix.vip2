# Thumbnail Sales Dropdown Enhancement Design

## Overview

Add expandable sales copy dropdowns to each of the 27 AI-generated app thumbnails in the dashboard. When users click a thumbnail, it expands to reveal structured sales content explaining what the app does and how local businesses can monetize it using different GTM Skills tonalities.

## Requirements

### Functional Requirements
- Click-to-expand interaction on thumbnail cards
- Smooth accordion-style animations using Framer Motion
- Pre-generated sales copy stored with app data
- Different sales tonality for each app, matched to app category
- Content structured with clear headings
- Mobile-responsive design

### Content Requirements
- **What it does**: Clear explanation of app functionality
- **How it makes money**: Specific monetization strategies for local businesses
- **Why businesses need it**: Value proposition using assigned sales tonality
- Focus on local business applications and revenue generation

### Technical Requirements
- Expandable cards within existing DashboardToolsSection component
- Maintain existing thumbnail loading and error handling
- Accessible keyboard navigation
- Touch-friendly on mobile devices

## Architecture

### Component Structure
```
DashboardToolsSection
├── AppGrid/AppCard
    ├── ThumbnailImage (existing)
    ├── AppInfo (existing)
    ├── ExpandToggle (new)
    └── SalesContent (new - conditionally rendered)
        ├── WhatItDoes
        ├── HowItMakesMoney
        └── WhyBusinessesNeedIt
```

### Data Structure
```typescript
interface App {
  // existing fields...
  salesCopy: {
    tonality: string;
    whatItDoes: string;
    howItMakesMoney: string;
    whyBusinessesNeedIt: string;
  };
}
```

### State Management
- `expandedCards: Record<string, boolean>` - tracks which cards are expanded
- Single expansion at a time to prevent layout issues (accordion behavior)
- Handle concurrent expansion conflicts with user feedback

## Implementation Details

### UI Components
1. **ExpandToggle**: Small chevron/down arrow icon that rotates on expand
2. **SalesContent**: Expandable container with structured content sections
3. **Animation**: Framer Motion for smooth expand/collapse with height transitions

### Content Generation
1. **Tonality Assignment**: Match GTM Skills tonalities to app categories:
   - Video apps: Steve Jobs (command attention), Hemingway (technical clarity)
   - Lead-gen apps: Challenger Sale (insight-driven), Value-Based (ROI-focused)
   - Creative apps: Seth Godin (remarkable positioning), Cormac McCarthy (visionary)
   - Branding apps: Jeff Bezos (customer-obsessed), Trusted Advisor (relationship-first)
   - Personalizer apps: Chris Voss (tactical empathy), Pain Point Research (deep discovery)

2. **Content Structure**: Each app gets unique sales copy following the assigned tonality while covering:
   - App capabilities and use cases
   - Specific monetization strategies for local businesses
   - Compelling reasons to adopt the solution

3. **Generation Process**: Use AI prompts with assigned tonality frameworks to create consistent, persuasive copy. Include scripts for bulk generation and validation of tonality adherence.

### Interaction Design
- Click anywhere on card toggles expansion
- Visual feedback: chevron rotation, subtle background change
- Expandable content pushes down subsequent cards
- Smooth animations prevent jarring layout shifts

## Data Flow

1. **Build Time**: Generate sales copy for all apps using assigned tonalities
2. **Runtime**: Load apps data including pre-generated sales copy
3. **User Interaction**: Click triggers state change and animation
4. **Content Display**: Render structured sales content with proper formatting

## Error Handling

- Graceful fallback if sales copy is missing ("Content unavailable" message)
- Animation failsafe for older browsers
- Touch event handling for mobile devices
- Keyboard accessibility support with ARIA attributes (`aria-expanded`, `role="button"`)
- Logging for missing sales copy scenarios

## Performance Considerations

- Pre-generated content eliminates API calls
- Lazy loading of expanded content if needed
- Optimized animations to prevent layout thrashing
- Minimal impact on initial page load

## Testing Strategy

- Visual regression tests for expanded states
- Accessibility testing for keyboard navigation and ARIA compliance
- Mobile touch testing for expand/collapse interactions
- Content validation for all 27 apps and tonality adherence
- Performance testing for animation smoothness on low-end devices
- Integration tests for data loading states and error handling

## Success Criteria

- All 27 thumbnails have functional dropdowns
- Sales copy loads instantly on click
- Smooth animations on all devices
- Content clearly explains functionality and monetization
- Different tonality for each app category
- Mobile-friendly interaction
- No impact on existing thumbnail loading