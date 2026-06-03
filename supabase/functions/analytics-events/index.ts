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
    // Use service_role key for writes (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

// Insert events into analytics table (using admin_analytics_events which exists in schema)
     // Note: We map event types to match the table's CHECK constraint
     const eventTypeMap: Record<string, string> = {
       'page_view': 'user_login',
       'page_hidden': 'admin_action',
       'page_visible': 'admin_action',
       'error': 'admin_action',
       'performance': 'admin_action',
       'user_interaction': 'admin_action',
       'modal_opened': 'app_access_granted',
       'modal_closed': 'admin_action',
       'card_hovered': 'admin_action',
       'card_clicked': 'admin_action',
       'section_viewed': 'admin_action',
       'cta_clicked': 'admin_action',
       'purchase_start': 'purchase_completed',
       'purchase_complete': 'purchase_completed',
       'image_load_success': 'admin_action',
       'image_load_error': 'admin_action',
     };

     const { data, error } = await supabaseClient
       .from('admin_analytics_events')
       .insert(validEvents.map((event: AnalyticsEvent) => ({
         event_type: eventTypeMap[event.event_type] || 'admin_action',
         entity_type: event.app_id ? 'app' : 'page',
         entity_id: event.app_id || null,
         user_id: event.user_id || null,
         admin_id: event.user_id || null,
         metadata: {
           original_event_type: event.event_type,
           event_name: event.event_name,
           session_id: event.session_id,
           url: event.url,
           user_agent: req.headers.get('User-Agent')?.substring(0, 255) || 'unknown',
           referrer: event.referrer,
           performance_metric: event.performance_metric,
           performance_value: event.performance_value,
           error_message: event.error_message,
           timestamp: event.timestamp,
         },
         created_at: new Date().toISOString(),
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