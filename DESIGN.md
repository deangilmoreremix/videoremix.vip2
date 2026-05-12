# DESIGN.md — VideoRemix.vip

## Colors

**Brand Colors (OKLCH):**
- Primary: `#4f46e5` (Indigo-600, OKLCH: 0.46 0.15 280)
- Secondary: `#ec4899` (Pink-500, OKLCH: 0.62 0.21 350)
- Accent: `#8b5cf6` (Violet-400)

**Neutrals (tinted toward indigo):**
- Gray-50: `#f8f7ff` (tinted with 0.01 chroma indigo)
- Gray-100: `#f1f0ff`
- Gray-200: `#e4e1ff`
- Gray-800: `#1e1b4a` (dark neutral tinted)
- Gray-900: `#0f0d2b`
- Black: `#050510` (never pure #000)

**Strategy:** Committed — indigo/violet carries 40% of surfaces, with pink as action color.

## Typography

**Font Family:** Inter (already loaded)

**Scale (modular, 1.25 ratio):**
- Hero: `clamp(2.5rem, 5vw, 4.5rem)` — 40-72px
- H1: `clamp(2rem, 4vw, 3rem)` — 32-48px
- H2: `clamp(1.5rem, 3vw, 2.25rem)` — 24-36px
- H3: `clamp(1.25rem, 2.5vw, 1.875rem)` — 20-30px
- Body: `1rem` (16px) with `line-height: 1.6`
- Small: `0.875rem` (14px)

**Weights:** Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

**Line length:** Body text capped at 65ch.

## Spacing

**Scale (not uniform):**
- xs: `0.5rem` (8px)
- sm: `1rem` (16px)
- md: `1.5rem` (24px)
- lg: `2rem` (32px)
- xl: `3rem` (48px)
- 2xl: `4rem` (64px)
- 3xl: `6rem` (96px)

**Rhythm:** Vary by section — tight groupings (sm) for related elements, generous (xl) between sections.

## Elevation

**Glass morphism (premium features):**
```css
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
```

**Shadows:**
- sm: `0 2px 8px rgba(0,0,0,0.1)`
- md: `0 10px 40px rgba(0,0,0,0.15)`
- lg: `0 20px 60px rgba(0,0,0,0.2)`

## Components

**Buttons:**
- Primary: `bg-primary-600 text-white hover:bg-primary-700`
- Secondary: `bg-secondary-600 text-white`
- Outline: `border-primary-600 text-primary-600`

**Cards:**
- Background: `bg-gray-900/50 backdrop-blur`
- Hover: `transform: translateY(-5px)` with shadow increase
- 3D effect for premium features

**Inputs:**
- Background: `bg-gray-800 border-gray-700`
- Focus: `ring-2 ring-primary-500`

## Motion

**Principles:**
- Entrance animations: Staggered reveals on page load
- Hover states: Subtle transforms (0.3s ease)
- Loading: Shimmer effects, not spinners where possible
- Accessibility: Respect `prefers-reduced-motion`

**Key animations:**
- `float`: 6s ease-in-out infinite (floating elements)
- `shimmer`: 20s linear infinite (background effects)
- `gradient-shift`: 10s ease infinite (gradient transitions)

## Layout

**Grid:** Asymmetric when possible, not centered stacks
**Container:** `max-w-7xl mx-auto` with responsive padding
**Breakpoints:** sm: 640px, md: 768px, lg: 1024px, xl: 1280px
