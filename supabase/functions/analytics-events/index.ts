import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyticsEvent {
  event_type: string;
  event_name: string;
  timestamp: string;
  session_id: string;
  user_id?: string;
  app_id?: string;
  user_owned?: boolean;
  modal_section?: string;
  cta_type?: string;
  performance_metric?: string;
  performance_value?: number;
  error_message?: string;
  url?: string;
  user_agent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { events } = await req.json()

    if (!Array.isArray(events)) {
      throw new Error('Events must be an array')
    }

    // Validate events
    const validEvents = events.filter((event: any) => {
      return event.event_type && event.event_name && event.timestamp && event.session_id
    })

    if (validEvents.length === 0) {
      throw new Error('No valid events provided')
    }

    // Insert events into analytics table
    const { data, error } = await supabaseClient
      .from('analytics_events')
      .insert(validEvents.map((event: AnalyticsEvent) => ({
        ...event,
        created_at: new Date().toISOString(),
        ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown',
        user_agent: req.headers.get('User-Agent') || 'unknown',
      })))

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        events_processed: validEvents.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})