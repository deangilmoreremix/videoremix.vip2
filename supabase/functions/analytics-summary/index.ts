import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyticsSummary {
  total_sessions: number;
  total_users: number;
  total_events: number;
  conversion_rate: number;
  avg_session_duration: number;
  top_performing_apps: Array<{
    app_id: string;
    app_name: string;
    views: number;
    clicks: number;
    purchases: number;
    conversion_rate: number;
  }>;
  funnel_metrics: {
    card_views: number;
    card_clicks: number;
    modal_opens: number;
    cta_clicks: number;
    purchases: number;
  };
  performance_metrics: {
    avg_modal_load_time: number;
    image_load_success_rate: number;
    error_rate: number;
  };
  ab_test_results: Array<{
    test_id: string;
    test_name: string;
    variants: Array<{
      variant: string;
      conversions: number;
      conversion_rate: number;
      confidence: number;
    }>;
    winner?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get time range from query params
    const url = new URL(req.url)
    const range = url.searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Fetch analytics data
    const { data: events, error } = await supabaseClient
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw error
    }

    // Process events to generate summary
    const summary: AnalyticsSummary = {
      total_sessions: new Set(events.filter(e => e.event_type === 'user_interaction').map(e => e.session_id)).size,
      total_users: new Set(events.filter(e => e.user_id).map(e => e.user_id)).size,
      total_events: events.length,
      conversion_rate: 0,
      avg_session_duration: 0,
      top_performing_apps: [],
      funnel_metrics: {
        card_views: 0,
        card_clicks: 0,
        modal_opens: 0,
        cta_clicks: 0,
        purchases: 0,
      },
      performance_metrics: {
        avg_modal_load_time: 0,
        image_load_success_rate: 0,
        error_rate: 0,
      },
      ab_test_results: [],
    }

    // Calculate funnel metrics
    summary.funnel_metrics = {
      card_views: events.filter(e => e.event_name === 'card_hovered').length,
      card_clicks: events.filter(e => e.event_name === 'card_clicked').length,
      modal_opens: events.filter(e => e.event_name === 'modal_opened').length,
      cta_clicks: events.filter(e => e.event_name === 'cta_clicked').length,
      purchases: events.filter(e => e.event_name === 'purchase_complete').length,
    }

    // Calculate conversion rate
    if (summary.funnel_metrics.card_clicks > 0) {
      summary.conversion_rate = summary.funnel_metrics.purchases / summary.funnel_metrics.card_clicks
    }

    // Calculate average session duration (simplified)
    const sessions = new Map<string, { start: Date, end: Date }>()
    events.forEach(event => {
      const timestamp = new Date(event.timestamp)
      if (!sessions.has(event.session_id)) {
        sessions.set(event.session_id, { start: timestamp, end: timestamp })
      } else {
        const session = sessions.get(event.session_id)!
        if (timestamp < session.start) session.start = timestamp
        if (timestamp > session.end) session.end = timestamp
      }
    })

    const durations = Array.from(sessions.values()).map(s =>
      (s.end.getTime() - s.start.getTime()) / 1000
    )
    summary.avg_session_duration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    // Calculate performance metrics
    const modalLoadTimes = events
      .filter(e => e.event_name === 'performance_metric' && e.metadata?.performance_metric === 'modal_load_time')
      .map(e => e.metadata.performance_value)
    summary.performance_metrics.avg_modal_load_time = modalLoadTimes.length > 0
      ? modalLoadTimes.reduce((sum, t) => sum + t, 0) / modalLoadTimes.length
      : 0

    const imageEvents = events.filter(e => e.event_name === 'image_load_success' || e.event_name === 'image_load_error')
    summary.performance_metrics.image_load_success_rate = imageEvents.length > 0
      ? imageEvents.filter(e => e.event_name === 'image_load_success').length / imageEvents.length
      : 0

    const errorEvents = events.filter(e => e.event_type === 'error')
    summary.performance_metrics.error_rate = events.length > 0
      ? errorEvents.length / events.length
      : 0

    // Get top performing apps (simplified - would need app names from another table)
    const appStats = new Map<string, { views: number, clicks: number, purchases: number }>()
    events.forEach(event => {
      if (!event.app_id) return

      if (!appStats.has(event.app_id)) {
        appStats.set(event.app_id, { views: 0, clicks: 0, purchases: 0 })
      }

      const stats = appStats.get(event.app_id)!
      switch (event.event_name) {
        case 'card_hovered':
          stats.views++
          break
        case 'card_clicked':
          stats.clicks++
          break
        case 'purchase_complete':
          stats.purchases++
          break
      }
    })

    summary.top_performing_apps = Array.from(appStats.entries())
      .map(([app_id, stats]) => ({
        app_id,
        app_name: `App ${app_id}`, // Would need to join with apps table
        views: stats.views,
        clicks: stats.clicks,
        purchases: stats.purchases,
        conversion_rate: stats.clicks > 0 ? stats.purchases / stats.clicks : 0,
      }))
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 10)

    // A/B test results (simplified)
    const abEvents = events.filter(e => e.metadata?.test_id)
    const testStats = new Map<string, Map<string, { conversions: number, total: number }>>()

    abEvents.forEach(event => {
      const testId = event.metadata.test_id
      const variant = event.metadata.variant || 'unknown'

      if (!testStats.has(testId)) {
        testStats.set(testId, new Map())
      }

      const testVariants = testStats.get(testId)!
      if (!testVariants.has(variant)) {
        testVariants.set(variant, { conversions: 0, total: 0 })
      }

      const variantStats = testVariants.get(variant)!
      variantStats.total++

      if (event.event_name === 'purchase_complete') {
        variantStats.conversions++
      }
    })

    summary.ab_test_results = Array.from(testStats.entries()).map(([test_id, variants]) => ({
      test_id,
      test_name: test_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      variants: Array.from(variants.entries()).map(([variant, stats]) => ({
        variant,
        conversions: stats.conversions,
        conversion_rate: stats.total > 0 ? stats.conversions / stats.total : 0,
        confidence: 95, // Simplified - would need statistical calculation
      })),
    }))

    return new Response(
      JSON.stringify(summary),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Analytics summary error:', error)
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