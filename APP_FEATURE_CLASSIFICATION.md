# App-Feature Classification Document

## Overview
This document classifies all 37+ items from the platform into a hierarchical structure of Apps and Features.

**Structure:**
- **Main Apps** (8-12): Standalone products that users purchase
- **Features** (within apps): Capabilities included when purchasing the parent app
- **Standalone Tools** (10-15): Independent tools that don't fit within a larger app

---

## 1. AI Video Creator Suite (Main App)

**Category:** video
**Purchase Level:** App (includes all features)

### Included Features:
- **AI Editing** (ai-editing) - Intelligent video editing with auto-enhancement
- **Smart Templates** (smart-templates) - Professional video templates
- **Auto Captions** (auto-captions) - Automatic subtitle generation
- **Content Repurposing** (content-repurposing) - Turn long videos into clips
- **Promo Generator** (promo-generator) - Generate promotional videos
- **Text to Speech** (text-to-speech) - Convert text to natural speech
- **AI Niche Script Creator** (niche-script) - Generate video scripts
- **Video AI Editor** (video-ai-editor) - Advanced AI-powered editing
- **Interactive Video Outros** (interactive-outros) - Engage viewers at video end

---

## 2. AI Image & Graphics Suite (Main App)

**Category:** ai-image
**Purchase Level:** App (includes all features)

### Included Features:
- **AI Image Tools Collection** (ai-image-tools) - Collection of image creation tools
- **AI Art Generator** (ai-art) - Create stunning AI artwork
- **AI Background Remover** (bg-remover) - Remove backgrounds instantly
- **AI Video & Image** (ai-video-image) - Transform videos and images
- **Thumbnail Generator** (thumbnail-generator) - Create eye-catching thumbnails

---

## 3. Business Branding Suite (Main App)

**Category:** branding
**Purchase Level:** App (includes all features)

### Included Features:
- **Business Brander Enterprise** (business-brander) - Comprehensive branding solution
- **RE-BRANDER AI** (rebrander-ai) - Ultimate AI re-branding system
- **Business Branding Analyzer** (branding-analyzer) - Analyze brand presence
- **AI Branding Accelerator** (ai-branding) - Speed up branding with AI
- **AI Sales Maximizer** (ai-sales) - Optimize sales strategy

---

## 4. Personalizer Pro Suite (Main App)

**Category:** personalizer
**Purchase Level:** App (includes all features)

### Included Features:
- **AI Voice Coach Pro** (voice-coach) - Perfect speaking skills with AI
- **AI Resume Amplifier** (resume-amplifier) - Enhance resumes with AI
- **AI Screen Recorder** (personalizer-recorder) - Record and enhance screens
- **AI Profile Generator** (personalizer-profile) - Create optimized profiles
- **AI Skills Monetizer** (ai-skills-monetizer) - Turn skills into business
- **AI Signature** (ai-signature) - Generate professional signatures
- **AI Video & Image Transformer** (personalizer-video-image-transformer) - Transform media
- **Personalizer Text AI Editor** (personalizer-text-ai-editor) - Edit text with AI
- **Personalizer Advanced Text-Video AI Editor** (personalizer-advanced-text-video-editor) - Advanced editing
- **Personalizer AI Writing Toolkit** (personalizer-writing-toolkit) - Complete writing toolkit
- **URL Video Generation Templates & Editor** (personalizer-url-video-generation) - Generate videos from URLs

---

## 5. Lead Generation & Sales Suite (Main App)

**Category:** lead-gen
**Purchase Level:** App (includes all features)

### Included Features:
- **AI Sales Monetizer** (sales-monetizer) - Convert leads to sales
- **AI Referral Maximizer** (ai-referral-maximizer) - Maximize referral programs
- **Smart CRM Closer** (smart-crm-closer) - Close deals with CRM automation
- **FunnelCraft AI** (funnelcraft-ai) - Build high-converting funnels
- **Sales Assistant App** (sales-assistant-app) - Complete AI sales assistant

---

## 6. Creative Content Suite (Main App)

**Category:** creative
**Purchase Level:** App (includes all features)

### Included Features:
- **Storyboard AI** (storyboard) - Create professional storyboards
- **Smart Presentations** (smart-presentations) - Create engaging presentations
- **Social Media Pack** (social-pack) - Everything for social media success
- **AI Template Generator** (ai-template-generator) - Create custom templates
- **Interactive Shopping** (interactive-shopping) - Create interactive shopping experiences
- **Collaboration** (collaboration) - Team collaboration features

---

## 7. Standalone Tools

These are independent tools that don't fit within a larger suite:

### Standalone Apps:
- **Landing Page Creator** (landing-page) - Create landing pages in 60 seconds
  - Category: lead-gen
  - Standalone because it's a complete product on its own

---

## Database Structure

### Apps Table Enhancement
```sql
-- New columns needed:
- item_type: enum('app', 'feature', 'standalone')
- parent_app_id: uuid (nullable, references apps.id)
- feature_count: integer (calculated field)
- included_feature_ids: jsonb (array of feature IDs)
```

### App-Feature Links Table
```sql
CREATE TABLE app_feature_links (
  id uuid PRIMARY KEY,
  app_id uuid REFERENCES apps(id),
  feature_id uuid REFERENCES apps(id),
  sort_order integer,
  created_at timestamptz
);
```

---

## Migration Strategy

### Phase 1: Schema Updates
1. Add new columns to apps table
2. Create app_feature_links junction table
3. Add item_type enum and indexes

### Phase 2: Data Classification
1. Mark main apps as item_type = 'app'
2. Mark features as item_type = 'feature'
3. Mark standalone tools as item_type = 'standalone'
4. Set parent_app_id for all features

### Phase 3: Relationship Building
1. Populate app_feature_links table
2. Calculate feature_count for each app
3. Populate included_feature_ids arrays

### Phase 4: Access Control Updates
1. Update purchase grants to include all features
2. Modify access checking to cascade from parent apps
3. Update admin functions to handle hierarchy

---

## Estimated Counts

- **Main Apps:** 6-7 comprehensive suites
- **Features:** 35-40 capabilities within apps
- **Standalone Tools:** 3-5 independent products
- **Total Items:** ~45 items (after removing duplicates and reorganization)

---

## User-Facing Changes

### Before:
"Browse 53 tools and features"

### After:
"Access 7 powerful apps with 40+ features"
- AI Video Creator Suite (9 features)
- AI Image & Graphics Suite (5 features)
- Business Branding Suite (5 features)
- Personalizer Pro Suite (11 features)
- Lead Generation & Sales Suite (5 features)
- Creative Content Suite (6 features)
- Plus 3 standalone tools

---

## Next Steps

1. ✅ Create this classification document
2. ⏳ Create database migration with new schema
3. ⏳ Update data access hooks to support hierarchy
4. ⏳ Update UI components to display apps with features
5. ⏳ Update purchase flow for app-level purchases
6. ⏳ Test and validate all changes

---

**Last Updated:** 2025-11-15
