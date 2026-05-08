export interface GTMContent {
  groupId: string;
  targetAudience: string;
  valueProposition: string;
  useCases: string[];
  competitiveDiff: string;
  pricingRationale: string;
  integrationPoints: string[];
}

export const gtmContent: Record<string, GTMContent> = {
  "sales-lead-gen": {
    groupId: "sales-lead-gen",
    targetAudience: "Agencies, SaaS owners, consultants, SmartCRM users, sales teams, B2B outbound teams, account executives, business development reps.",
    valueProposition: "Transform every lead interaction, website visit, sales meeting, and prospect touchpoint into personalized, high-converting sales assets including tailored outreach sequences, follow-up campaigns, and data-driven closing plans that adapt to each prospect's unique needs and pain points.",
    useCases: [
      "Convert cold leads into personalized outreach campaigns using AI-generated messaging tailored to prospect industry, role, and pain points.",
      "Transform meeting notes and call recordings into structured follow-up sequences and action items.",
      "Analyze competitor positioning and adjust sales messaging to highlight unique differentiators in real time.",
      "Generate custom closing plans for high-value deals with step-by-step negotiation strategies and objection handling."
    ],
    competitiveDiff: "Unlike generic sales engagement tools that use templated sequences, our AI adapts to each prospect's context by ingesting meeting notes, website data, and CRM history to create hyper-personalized sales assets. Seamless integration with SmartCRM eliminates manual data entry, while native connections to VideoRemix's Personalizer suite enable multimedia sales content creation in one workflow.",
    pricingRationale: "Premium pricing tier aligned with sales team ROI: entry-level plan for individual reps focuses on outreach personalization, mid-tier for teams adds CRM integration and collaborative workflows, enterprise plan includes custom AI training on brand voice and sales methodology. Pricing scales with number of leads processed and campaigns generated, ensuring cost aligns with revenue impact.",
    integrationPoints: [
      "Integrates natively with SmartCRM to sync lead data, meeting notes, and deal stages for automated asset generation.",
      "Feeds generated outreach content and campaign assets to VideoRemix Personalizer suite for multimedia format conversion (video, audio, email templates).",
      "Connects to calendar tools (Google Calendar, Outlook) to auto-ingest meeting transcripts and generate follow-ups.",
      "Syncs with LinkedIn Sales Navigator and Apollo for enriched prospect data and targeted outreach."
    ]
  },
  "content-creation": {
    groupId: "content-creation",
    targetAudience: "Bloggers, content creators, coaches, marketing agencies, social media managers, newsletter publishers, podcast hosts, course creators.",
    valueProposition: "Repurpose existing video, blog, newsletter, and industry trend content into diverse, high-performing formats including email campaigns, social media posts, video scripts, podcast episodes, and cross-channel marketing campaigns in minutes instead of hours.",
    useCases: [
      "Turn a 10-minute YouTube video into 5 social media posts, 1 blog summary, and 2 email newsletter segments.",
      "Convert trending industry news into a full content calendar with timed posts across LinkedIn, Twitter, and Instagram.",
      "Repurpose a long-form blog post into a 3-part podcast script and accompanying show notes.",
      "Generate A/B test variations for email campaigns using existing high-performing content as a base."
    ],
    competitiveDiff: "Unlike single-format content tools, our AI handles end-to-end repurposing across 10+ content formats with brand voice consistency. Native integration with VideoRemix's video tools allows seamless conversion of text content into video scripts and voiceovers, while direct publishing integrations eliminate manual uploading.",
    pricingRationale: "Tiered pricing based on content volume and output formats: free tier for individual creators with limited monthly repurposes, pro tier for agencies with unlimited formats and team collaboration, enterprise tier adds custom brand voice training and API access for CMS integration. Pricing scales with number of source content pieces processed.",
    integrationPoints: [
      "Integrates with VideoRemix Video, Audio & Voice tools to convert text content into video scripts, voiceovers, and audiograms.",
      "Connects to CMS platforms (WordPress, Ghost) and social media schedulers (Buffer, Hootsuite) for direct publishing.",
      "Feeds generated content to SmartCRM for lead nurturing campaigns and sales follow-ups.",
      "Syncs with Google Analytics and social platforms to track content performance and optimize future repurposing."
    ]
  },
  "video-audio-voice": {
    groupId: "video-audio-voice",
    targetAudience: "Content creators, marketing agencies, local businesses, podcasters, YouTubers, small business owners, customer support teams, real estate agents.",
    valueProposition: "Deploy a custom AI voice agent trained on your business to handle customer inquiries, collect lead information, summarize sales calls, and generate audio content including podcasts, voiceovers, and automated customer service responses 24/7.",
    useCases: [
      "Add an AI voice agent to your business website to answer FAQs, qualify leads, and book sales calls automatically.",
      "Summarize 1-hour sales calls into 3-bullet action items and follow-up email drafts in minutes.",
      "Convert blog posts and scripts into natural-sounding audio content for podcasts, audiograms, and voice assistants.",
      "Generate personalized video voiceovers in multiple languages for global marketing campaigns."
    ],
    competitiveDiff: "Unlike generic voice AI tools, our agent integrates with your full business context including SmartCRM data, product docs, and past customer interactions to provide accurate, personalized responses. Native video integration allows instant conversion of voice content into edited video clips with subtitles and branding.",
    pricingRationale: "Usage-based pricing aligned with business size: small business plan includes 100 monthly agent interactions and 10 audio hours, agency plan scales to 1000 interactions and 100 audio hours with team access, enterprise plan offers unlimited usage and custom voice training. Add-on pricing for video integration and multilingual support.",
    integrationPoints: [
      "Integrates with SmartCRM to access lead data, customer history, and deal context for personalized agent responses.",
      "Connects to VideoRemix Content Creation tools to turn audio content into video clips, audiograms, and social media posts.",
      "Syncs with phone systems (Twilio, RingCentral) and website chat widgets for omnichannel agent deployment.",
      "Feeds call summaries and lead data to HR & Recruiting tools for interview scheduling and follow-ups."
    ]
  },
  "rag-knowledgebase": {
    groupId: "rag-knowledgebase",
    targetAudience: "Businesses with internal documentation, HR teams, legal departments, customer support teams, franchise owners, consultants, agencies with client SOPs.",
    valueProposition: "Upload company documents including PDFs, SOPs, training manuals, and policy docs to create a private, secure AI assistant trained exclusively on your business knowledge that answers employee questions, onboards new hires, and supports customers with accurate, brand-aligned responses.",
    useCases: [
      "Upload employee handbook and training docs to create an internal AI assistant that answers HR questions about benefits, PTO, and company policies.",
      "Ingest customer support knowledgebase to provide instant, accurate responses to common customer inquiries via chat or email.",
      "Train the assistant on franchise operations manuals to ensure consistent service delivery across all locations.",
      "Upload legal contracts and compliance docs to quickly retrieve clause details and obligation summaries during negotiations."
    ],
    competitiveDiff: "Unlike public AI tools that risk data leakage, our RAG system operates in a fully isolated environment with enterprise-grade encryption for all uploaded documents. Native integration with SmartCRM and HR tools allows the assistant to pull live data (deal status, employee records) alongside document knowledge for context-aware responses.",
    pricingRationale: "Tiered pricing based on document storage and user seats: starter plan includes 100MB storage and 10 user seats for small teams, business plan scales to 1GB storage and 50 seats with role-based access controls, enterprise plan offers unlimited storage, SSO integration, and custom data retention policies. Add-on pricing for live data integrations.",
    integrationPoints: [
      "Integrates with SmartCRM to combine document knowledge with lead, customer, and deal data for contextual assistant responses.",
      "Connects to HR & Recruiting tools to access employee records and onboarding materials for internal assistant use.",
      "Feeds knowledgebase answers to Legal & Compliance tools for contract clause verification and risk assessment.",
      "Syncs with customer support platforms (Zendesk, Intercom) to auto-populate ticket responses with knowledgebase content."
    ]
  },
  "realestate-local": {
    groupId: "realestate-local",
    targetAudience: "Realtors, real estate agencies, home service contractors (plumbers, electricians), local business owners, property managers, local marketers, small business consultants.",
    valueProposition: "Sell AI-powered business previews, marketing plans, sales scripts, and customer assistants to local businesses and real estate clients, enabling them to win more leads, close more deals, and deliver better customer experiences with minimal manual effort.",
    useCases: [
      "Generate a custom marketing plan and 6-month content calendar for a local restaurant using their website and social media data.",
      "Create personalized property preview videos and follow-up scripts for realtors to send to prospective buyers.",
      "Build an AI customer assistant for a local plumbing business to book appointments, answer service questions, and collect lead info.",
      "Develop ROI reports and competitive analysis for local business clients to justify marketing spend."
    ],
    competitiveDiff: "Unlike generic local marketing tools, our AI is trained on local business verticals (real estate, home services, retail) to generate industry-specific assets that convert. Seamless integration with VideoRemix's video tools allows instant creation of property tours, service demo videos, and customer testimonial clips.",
    pricingRationale: "Agency-focused pricing model: reseller plan allows agencies to white-label the tools and charge clients directly, per-client plan includes unlimited asset generation for a single local business, enterprise plan adds team collaboration and bulk client management. Commission-based add-on for lead generation services.",
    integrationPoints: [
      "Integrates with SmartCRM to manage local business leads, track deal progress, and automate follow-ups.",
      "Connects to Video, Audio & Voice tools to create property tours, service demos, and customer testimonial videos.",
      "Feeds local business marketing plans to Content Creation tools for cross-channel campaign execution.",
      "Syncs with local directory platforms (Google Business, Yelp) to auto-post generated content and respond to reviews."
    ]
  },
  "hr-recruiting": {
    groupId: "hr-recruiting",
    targetAudience: "Recruiters, HR teams, small business owners, hiring managers, staffing agencies, startup founders, corporate talent acquisition teams.",
    valueProposition: "Streamline hiring workflows by uploading resumes and job descriptions to get AI-generated candidate match scores, tailored interview questions, personalized outreach emails, and hiring summaries that reduce time-to-hire by 40% while improving candidate quality.",
    useCases: [
      "Upload 50 resumes and a job description to get ranked match scores with key skill gaps and interview focus areas for each candidate.",
      "Generate personalized interview questions and scorecards based on job requirements and candidate resume highlights.",
      "Create automated outreach emails for rejected candidates and follow-up messages for top prospects.",
      "Summarize 10 interviews into a consolidated hiring recommendation report with salary benchmarks and onboarding plans."
    ],
    competitiveDiff: "Unlike resume screening tools that use keyword matching, our AI evaluates soft skills, cultural fit, and career trajectory alongside hard skills using context from cover letters and portfolio links. Native integration with SmartCRM tracks candidates through the full funnel, while direct calendar integration automates interview scheduling.",
    pricingRationale: "Per-hire pricing model aligned with recruitment success: starter plan includes 10 monthly job postings and 100 resume screens, professional plan scales to 50 postings and 500 screens with team collaboration, enterprise plan offers unlimited postings, AI-powered candidate sourcing, and diversity analytics. Add-on pricing for onboarding content generation.",
    integrationPoints: [
      "Integrates with SmartCRM to manage candidate pipelines, track interview status, and sync hired employee data to HR systems.",
      "Connects to calendar tools (Google Calendar, Outlook) to auto-schedule interviews and send reminders.",
      "Feeds hired candidate profiles to RAG & Knowledgebase tools to auto-generate onboarding materials and policy acknowledgments.",
      "Syncs with job boards (LinkedIn Jobs, Indeed) to auto-post openings and import applications."
    ]
  },
  "finance-business": {
    groupId: "finance-business",
    targetAudience: "Entrepreneurs, small business owners, investors, financial analysts, startup founders, accountants, business consultants, venture capital associates.",
    valueProposition: "Turn messy financial spreadsheets, business ideas, and market data into clear, actionable financial summaries, revenue forecasts, investment memos, and decision reports that help you secure funding, optimize cash flow, and scale your business with confidence.",
    useCases: [
      "Upload a messy Excel P&L and balance sheet to generate a clean financial summary with key metrics (burn rate, gross margin, cash runway).",
      "Input a business idea and target market to create a 3-year revenue forecast with scenario planning for best/worst case.",
      "Generate an investment memo for VCs including market analysis, competitive landscape, and projected ROI.",
      "Analyze vendor contracts and expense reports to identify cost-saving opportunities and negotiate better terms."
    ],
    competitiveDiff: "Unlike generic accounting tools that only track historical data, our AI generates forward-looking forecasts and scenario plans using real-time market data and industry benchmarks. Native integration with SmartCRM pulls sales pipeline data to refine revenue projections, while direct integration with legal tools validates contract terms for financial risk.",
    pricingRationale: "Tiered pricing based on business size and output complexity: startup plan includes basic financial summaries and 1-year forecasts, business plan adds 3-year forecasts, scenario planning, and investor memo generation, enterprise plan offers custom financial modeling, audit trails, and API access for ERP integration. Add-on pricing for legal contract risk analysis.",
    integrationPoints: [
      "Integrates with SmartCRM to pull sales pipeline data, deal values, and close rates for accurate revenue forecasting.",
      "Connects to Legal & Compliance tools to assess financial risks in contracts, partnership agreements, and vendor terms.",
      "Feeds financial forecasts to Content Creation tools to generate investor pitch decks and marketing materials.",
      "Syncs with accounting software (QuickBooks, Xero) to auto-import financial data and eliminate manual entry."
    ]
  },
  "legal-compliance": {
    groupId: "legal-compliance",
    targetAudience: "Small business owners, freelancers, agencies, HR teams, contract managers, startup founders, compliance officers, legal consultants.",
    valueProposition: "Upload contracts, agreements, policies, and regulatory reports to get plain-English summaries, risk flags, obligation checklists, and expert-level questions to ask your legal team, reducing legal review time by 60% while minimizing compliance risks.",
    useCases: [
      "Upload a client services agreement to get a summary of key obligations, payment terms, termination clauses, and 3 high-risk areas to discuss with your lawyer.",
      "Analyze GDPR or CCPA privacy policies to generate a compliance gap report with actionable remediation steps.",
      "Review vendor contracts to identify unfavorable terms (auto-renewal, liability caps) and generate counteroffer language.",
      "Summarize regulatory filings (SEC, tax forms) into executive briefings with key deadlines and action items."
    ],
    competitiveDiff: "Unlike legal tools that only store documents, our AI actively identifies risks and gaps using up-to-date regulatory databases and industry-specific compliance standards. Native integration with SmartCRM and Finance tools cross-references contract terms with deal values and payment schedules to flag financial risks early.",
    pricingRationale: "Per-document pricing aligned with risk level: basic plan includes 10 monthly document summaries with risk flags, professional plan adds compliance gap reports and counteroffer language generation, enterprise plan offers unlimited documents, SSO integration, and custom regulatory database access. Add-on pricing for e-signature integration and legal team collaboration.",
    integrationPoints: [
      "Integrates with SmartCRM to cross-reference contract terms with deal values, payment schedules, and client history for risk assessment.",
      "Connects to Finance & Business tools to analyze financial risks in contracts, vendor agreements, and investment terms.",
      "Feeds compliance gap reports to RAG & Knowledgebase tools to auto-generate employee training materials and policy updates.",
      "Syncs with e-signature platforms (DocuSign, HelloSign) to auto-send counteroffer agreements and track signature status."
    ]
  },
  "coding-developer": {
    groupId: "coding-developer",
    targetAudience: "Software developers, startup founders, vibe coders, SaaS builders, DevOps engineers, technical product managers, freelance developers, coding bootcamp students.",
    valueProposition: "Paste your code repository, error logs, or feature ideas to get AI-generated build plans, bug fix roadmaps, system architecture diagrams, and step-by-step coding instructions that accelerate development velocity by 50% while reducing technical debt.",
    useCases: [
      "Paste a React error stack trace to get a root cause analysis and 3 potential fix approaches with code examples.",
      "Input a feature idea (e.g., 'add Stripe subscriptions') to generate a full build plan with component breakdown, API endpoints, and testing steps.",
      "Upload a legacy codebase to get a system architecture diagram, tech debt report, and modernization roadmap.",
      "Generate unit tests and documentation for existing functions using code context and best practices."
    ],
    competitiveDiff: "Unlike code completion tools that only suggest snippets, our AI understands full repository context including dependencies, frameworks, and business logic to generate end-to-end implementation plans. Native integration with VideoRemix's design tools allows conversion of UI mockups into functional component code, while direct Git integration automates pull request generation.",
    pricingRationale: "Developer-seat pricing model: free tier for individual vibe coders with limited monthly queries, pro tier for professional developers includes unlimited queries, repo uploads, and architecture diagrams, team tier adds collaborative code reviews and shared build plans. Enterprise tier offers custom model training on proprietary codebases and SSO integration.",
    integrationPoints: [
      "Integrates with Git platforms (GitHub, GitLab) to auto-import repos, error logs, and pull requests for analysis.",
      "Connects to Design & UI/UX tools to convert Figma mockups and wireframes into functional React/Vue components.",
      "Feeds build plans and bug fixes to Productivity & Personal tools to auto-generate developer task lists and documentation.",
      "Syncs with Jira and Linear to auto-create tickets from feature plans and bug reports."
    ]
  },
  "design-uiux": {
    groupId: "design-uiux",
    targetAudience: "Marketing agencies, SaaS builders, UI/UX designers, product managers, landing page creators, e-commerce managers, freelance designers, CRO specialists.",
    valueProposition: "Upload landing page screenshots, app wireframes, or design mockups to get AI-powered conversion feedback, UI/UX improvement suggestions, CTA optimization, and wireframe revisions that increase conversion rates by up to 30% without expensive redesigns.",
    useCases: [
      "Upload a SaaS landing page screenshot to get a conversion audit with 5 high-impact fixes (CTA placement, headline clarity, trust signal additions).",
      "Input a mobile app wireframe to generate accessibility improvements and user flow optimizations for reduced bounce rates.",
      "Analyze competitor landing pages to identify design gaps and generate A/B test variations for headlines, CTAs, and hero images.",
      "Convert a rough sketch into a polished wireframe with component suggestions aligned with your brand design system."
    ],
    competitiveDiff: "Unlike design review tools that only check accessibility, our AI evaluates conversion psychology, brand alignment, and user journey flow using industry benchmarks and real-world performance data. Native integration with VideoRemix's content tools allows instant generation of hero videos, testimonial sections, and CTA graphics to implement suggested improvements.",
    pricingRationale: "Per-project pricing aligned with design scope: starter plan includes 5 monthly design audits with basic feedback, professional plan adds wireframe generation, A/B test variations, and brand alignment checks, agency plan offers unlimited audits, team collaboration, and white-label reporting. Add-on pricing for video content generation and e-commerce integration.",
    integrationPoints: [
      "Integrates with Video, Audio & Voice tools to convert design suggestions into hero videos, product demos, and CTA graphics.",
      "Connects to Content Creation tools to generate copy for optimized CTAs, headlines, and landing page sections.",
      "Feeds design improvements to Coding & Developer tools to auto-generate updated UI components and style sheets.",
      "Syncs with A/B testing platforms (Optimizely, VWO) to auto-deploy test variations and track performance."
    ]
  },
  "research-education": {
    groupId: "research-education",
    targetAudience: "Course creators, consultants, market analysts, academic researchers, corporate trainers, instructional designers, subject matter experts, content strategists.",
    valueProposition: "Research any topic, summarize the highest-quality sources, and turn insights into training materials, course curricula, research reports, and publishable content that establishes your authority and saves 80% of research time.",
    useCases: [
      "Research 'AI trends in SaaS' to generate a 10-page report with summarized sources, key insights, and citation list.",
      "Convert a research report into a 12-module course curriculum with lesson plans, quizzes, and slide decks.",
      "Analyze competitor course offerings to identify content gaps and generate a unique course outline that outperforms the market.",
      "Summarize academic papers into executive briefings and social media snippets for non-technical audiences."
    ],
    competitiveDiff: "Unlike generic research tools that return unstructured search results, our AI evaluates source credibility, cross-references findings, and synthesizes insights into structured, actionable outputs. Native integration with VideoRemix's content tools allows instant conversion of research into video courses, podcasts, and social media content.",
    pricingRationale: "Tiered pricing based on output type and volume: creator plan includes 10 monthly research summaries and basic course outlines, educator plan adds full course curriculum generation, quiz creation, and slide deck exports, enterprise plan offers custom source database access, team collaboration, and white-label content exports. Add-on pricing for video/audio content conversion.",
    integrationPoints: [
      "Integrates with Content Creation tools to turn research insights into blog posts, social media campaigns, and email newsletters.",
      "Connects to Video, Audio & Voice tools to convert course curricula into video lectures, podcast episodes, and audiobook summaries.",
      "Feeds training materials to RAG & Knowledgebase tools to create internal team training assistants and SOPs.",
      "Syncs with LMS platforms (Teachable, Thinkific) to auto-upload course content and track student progress."
    ]
  },
  "productivity-personal": {
    groupId: "productivity-personal",
    targetAudience: "Professionals, creators, remote teams, consultants, small business owners, freelancers, project managers, executive assistants.",
    valueProposition: "Deploy a personal AI assistant that remembers your work history, document preferences, business context, and recurring tasks to automate meeting prep, follow-ups, task management, and content generation, saving 10+ hours per week on administrative work.",
    useCases: [
      "Auto-generate meeting agendas and pre-read materials by pulling context from past meetings, related documents, and attendee history.",
      "Summarize your weekly work activity into a status report with key accomplishments, pending tasks, and blockers.",
      "Generate personalized follow-up emails and task reminders based on meeting notes and calendar events.",
      "Create custom templates for recurring tasks (invoices, proposals, social posts) that auto-populate with your brand and past content."
    ],
    competitiveDiff: "Unlike personal assistants that forget context between sessions, our AI retains long-term memory of your work history, preferences, and business relationships across all VideoRemix tools. Native integration with SmartCRM, Content Creation, and Calendar tools eliminates manual data entry for seamless workflow automation.",
    pricingRationale: "Seat-based pricing aligned with team size: personal plan includes 1 user with basic memory and task automation, team plan adds 10 users with shared context and collaborative workflows, enterprise plan offers unlimited users, SSO integration, and custom memory retention policies. Add-on pricing for department-specific workflows (sales, marketing, HR).",
    integrationPoints: [
      "Integrates with SmartCRM to remember client preferences, past interactions, and deal context for personalized follow-ups.",
      "Connects to Calendar tools (Google Calendar, Outlook) to auto-sync meetings, agendas, and follow-up tasks.",
      "Feeds generated content and task lists to Content Creation and Coding tools for seamless cross-tool workflows.",
      "Syncs with RAG & Knowledgebase tools to remember internal document context and team SOPs for automated task execution."
    ]
  }
};
