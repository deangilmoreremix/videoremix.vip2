import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

import { createClient } from '@supabase/supabase-js';

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

import OpenAI from 'npm:openai@4.78.1';;
import Exa from 'npm:exa-js@4.0.0';;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: userApiKey,
});

const exa = new Exa(Deno.env.get('EXA_API_KEY')!);

interface LeadInfo {
  companyName: string;
  websiteUrl: string;
  contactName: string;
  position: string;
  department: string;
  campaignType: string;
  userId?: string;
}

interface CompanyResearch {
  companyDescription: string;
  recentNews: string[];
  decisionMakerBackground: string;
  gtmStrategy?: string;
  specificAchievement?: string;
}

interface EmailResult {
  lead: LeadInfo;
  department: string;
  campaignType: string;
  email: string;
  research: CompanyResearch;
  timestamp: string;
}

async function researchCompany(lead: LeadInfo): Promise<CompanyResearch> {
  const research: CompanyResearch = {
    companyDescription: '',
    recentNews: [],
    decisionMakerBackground: '',
  };

  // Search company overview using Exa
  try {
    const companySearch = await exa.searchAndContents(
      `${lead.companyName} company overview mission products services`,
      { 
        useAutoprompt: true,
        numResults: 3,
        text: { maxCharacters: 2000 }
      }
    );
    
    if (companySearch.results && companySearch.results.length > 0) {
      research.companyDescription = companySearch.results[0].text?.substring(0, 1000) || 
        `${lead.companyName} is a technology company.`;
      
      // Extract recent news from top results
      research.recentNews = companySearch.results
        .slice(0, 3)
        .map(r => r.title || r.url)
        .filter(Boolean) as string[];
    }
  } catch (error) {
    console.error('Exa company search error:', error);
    research.companyDescription = `${lead.companyName} (no additional data available)`;
  }

  // Search for contact person background
  try {
    const personSearch = await exa.searchAndContents(
      `${lead.contactName} ${lead.companyName} background experience linkedin profile`,
      {
        useAutoprompt: true,
        numResults: 2,
        text: { maxCharacters: 1500 }
      }
    );
    
    if (personSearch.results && personSearch.results.length > 0) {
      const backgroundText = personSearch.results
        .map(r => r.text)
        .filter(Boolean)
        .join(' ');
      research.decisionMakerBackground = backgroundText.substring(0, 500) || 
        `Leadership at ${lead.companyName}`;
    }
  } catch (error) {
    console.error('Exa person search error:', error);
    research.decisionMakerBackground = `Decision maker at ${lead.companyName}`;
  }

  // Try to find GTM strategy or recent achievement based on department
  if (lead.department === "GTM (Sales & Marketing)" || lead.department === "Marketing Professional") {
    try {
      const gtmSearch = await exa.searchAndContents(
        `${lead.companyName} go-to-market strategy sales approach recent campaign`,
        {
          useAutoprompt: true,
          numResults: 2,
          text: { maxCharacters: 1000 }
        }
      );
      
      if (gtmSearch.results && gtmSearch.results.length > 0) {
        research.gtmStrategy = gtmSearch.results[0].text?.substring(0, 300);
        research.specificAchievement = gtmSearch.results[0]?.title || "recent initiative";
      }
    } catch (error) {
      console.error('Exa GTM search error:', error);
    }
  }

  return research;
}

function buildEmailTemplate(lead: LeadInfo, research: CompanyResearch): string {
  const { companyName, contactName, position, department, campaignType } = lead;
  
  // Dynamic fill-ins based on research
  const companyDesc = research.companyDescription || companyName;
  const recentNews = research.recentNews[0] || "recent initiatives";
  const achievement = research.specificAchievement || "impressive growth";
  const dmBackground = research.decisionMakerBackground || `your role as ${position}`;
  
  // Templates by department and campaign type
  const templates: Record<string, Record<string, (info: any) => string>> = {
    "GTM (Sales & Marketing)": {
      "Software Solution": (info: any) => `Hey ${contactName},

I've been following ${companyName}'s work in ${companyDesc.substring(0, 100)}... and particularly impressed by ${achievement}.

I lead a team that builds AI-powered sales enablement tools that help teams like yours personalize outreach at scale, track prospect engagement, and close more deals.

Our platform integrates directly with Salesforce/HubSpot and typically helps revenue teams increase qualified pipeline by 30-40% within 90 days.

Would you be open to a brief call to explore how this could amplify your GTM motion? You can book time here: [CALENDAR_LINK]

Best,
[SIGNATURE]`,

      "Consulting Services": (info: any) => `Hey ${contactName},

Your team's work on ${recentNews} caught my eye—especially how you're approaching ${info.gtmStrategy || "go-to-market"}.

We run a consulting practice that helps B2B companies optimize their sales motion and build predictable pipeline. We've worked with companies like [Similar Company] to revamp their outbound strategy and increase conversion by 2.5x.

I think we could help ${companyName} accelerate your growth targets for this quarter.

Open to a 15-minute exploration call? [CALENDAR_LINK]

Best,
[SIGNATURE]`
    },

    "Human Resources": {
      "HR Tech Solution": (info: any) => `Hey ${contactName},

I've been tracking ${companyName}'s growth and noticed your investment in scaling the team—especially ${recentNews}.

Our AI platform helps HR teams automate candidate sourcing, personalize outreach, and reduce time-to-hire by 60%+ while improving quality.

I'd love to explore if this could help your team scale more efficiently.

Calendar link if you're curious: [CALENDAR_LINK]

Best,
[SIGNATURE]`,

      "Consulting Services": (info: any) => `Hey ${contactName},

Impressed by ${companyName}'s approach to ${companyDesc.substring(0, 80)}... Particularly your work in ${info.hrFocus || "talent acquisition"}.

We partner with high-growth companies to design and execute talent strategies that attract top-tier talent while reducing turnover.

Would a quick chemistry call make sense? [CALENDAR_LINK]

Best,
[SIGNATURE]`
    },

    "Engineering": {
      "DevTools": (info: any) => `Hey ${contactName},

I've been following ${companyName}'s engineering blog and love the direction you're taking with ${companyDesc.substring(0, 80)}.

We're building developer tools that help engineering teams ship faster with better observability and automated code review.

Your team's scale suggests you'd see immediate ROI. Want to see a quick demo? [CALENDAR_LINK]

Best,
[SIGNATURE]`,

      "Consulting Services": (info: any) => `Hey ${contactName},

Your work on ${recentNews} is solid. It's clear you're building something special at ${companyName}.

We help engineering organizations solve hard infrastructure and reliability challenges—stuff that keeps founders/CTOs up at night.

If you're facing any scaling pains, I'd be happy to share patterns we've seen at similar companies.

Best,
[SIGNATURE]`
    },

    "Executive": {
      "Strategic Partnership": (info: any) => `Hey ${contactName},

${companyName} is doing impressive things—especially ${achievement}. I've been tracking your progress and think there could be strategic alignment.

We're exploring partnerships with companies in your space to create joint value for customers. Happy to explore what that could look like.

Open to a brief conversation? [CALENDAR_LINK]

Best,
[SIGNATURE]`,

      "Investment Opportunity": (info: any) => `Hey ${contactName},

Your vision at ${companyName} is compelling. The ${recentNews} shows real momentum.

I represent an early-stage fund that invests in companies at your stage—typically $250k-500k for seed/series A. We also provide hands-on support with GTM and hiring.

Would you be open to sharing your deck? I can intro you to the right partner here: [CALENDAR_LINK]

Best,
[SIGNATURE]`
    }
  };

  // Get appropriate template
  const deptTemplates = templates[department];
  if (!deptTemplates) {
    // Fallback generic
    return `Hey ${contactName},

I've been following ${companyName} and am impressed by what you're building.

We help companies like yours with AI-powered solutions that drive measurable results.

Would love to show you how this could help ${companyName} achieve your goals: [CALENDAR_LINK]

Best,
[SIGNATURE]`;
  }

  const templateFn = deptTemplates[campaignType] || deptTemplates["Software Solution"];
  return templateFn({ ...lead, ...research });
}


  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's openai API key
  const userApiKey = await getUserApiKey(user_id, 'openai');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your openai API key in your profile.',
      provider: 'openai'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }

  try {
    const input: LeadInfo = await req.json();

    // Validate required fields
    if (!input.companyName || !input.websiteUrl || !input.contactName || !input.position) {
      return new Response(JSON.stringify({ error: 'Missing required lead information' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
    }

    // Step 1: Research the company and contact
    const research = await researchCompany(input);

    // Step 2: Build personalized email
    const email = buildEmailTemplate(input, research);

    const result: EmailResult = {
      lead: input,
      department: input.department,
      campaignType: input.campaignType,
      email,
      research,
      timestamp: new Date().toISOString()
    };

    // Log to database
    try {
      await supabase
        .from('ai_agent_runs')
        .insert({
          agent_type: 'email_gtm_agent',
          user_id: input.userId || null,
          input_data: {
            companyName: input.companyName,
            websiteUrl: input.websiteUrl,
            contactName: input.contactName,
            position: input.position,
            department: input.department,
            campaignType: input.campaignType
          },
          output_data: result,
          status: 'completed',
          created_at: result.timestamp
        });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }
}
