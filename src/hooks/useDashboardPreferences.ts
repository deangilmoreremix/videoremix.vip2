import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

export interface DashboardPreferences {
  theme: 'dark' | 'light';
  layout_density: 'compact' | 'comfortable';
  widget_order: string[];
  hidden_widgets: string[];
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  theme: 'dark',
  layout_density: 'comfortable',
  widget_order: [],
  hidden_widgets: [],
};

export const useDashboardPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_dashboard_preferences')
        .select('theme, layout_density, widget_order, hidden_widgets')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching preferences:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setPreferences({
          theme: data.theme || 'dark',
          layout_density: data.layout_density || 'comfortable',
          widget_order: data.widget_order || [],
          hidden_widgets: data.hidden_widgets || [],
        });
      } else {
        await createDefaultPreferences();
      }
    } catch (err) {
      console.error('Error in fetchPreferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { data, error: insertError } = await supabase
        .from('user_dashboard_preferences')
        .insert({
          user_id: user.id,
          theme: DEFAULT_PREFERENCES.theme,
          layout_density: DEFAULT_PREFERENCES.layout_density,
          widget_order: DEFAULT_PREFERENCES.widget_order,
          hidden_widgets: DEFAULT_PREFERENCES.hidden_widgets,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return;
      }

      if (data) {
        setPreferences({
          theme: data.theme,
          layout_density: data.layout_density,
          widget_order: data.widget_order || [],
          hidden_widgets: data.hidden_widgets || [],
        });
      }
    } catch (err) {
      console.error('Error in createDefaultPreferences:', err);
    }
  };

  const updatePreferences = async (updates: Partial<DashboardPreferences>) => {
    if (!user) return;

    try {
      setError(null);
      const newPreferences = { ...preferences, ...updates };

      const { error: updateError } = await supabase
        .from('user_dashboard_preferences')
        .update({
          theme: newPreferences.theme,
          layout_density: newPreferences.layout_density,
          widget_order: newPreferences.widget_order,
          hidden_widgets: newPreferences.hidden_widgets,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        setError(updateError.message);
        return;
      }

      setPreferences(newPreferences);
    } catch (err) {
      console.error('Error in updatePreferences:', err);
      setError('Failed to update preferences');
    }
  };

  const setTheme = (theme: 'dark' | 'light') => {
    updatePreferences({ theme });
  };

  const setLayoutDensity = (density: 'compact' | 'comfortable') => {
    updatePreferences({ layout_density: density });
  };

  const toggleWidget = (widgetId: string) => {
    const isHidden = preferences.hidden_widgets.includes(widgetId);
    const newHiddenWidgets = isHidden
      ? preferences.hidden_widgets.filter(id => id !== widgetId)
      : [...preferences.hidden_widgets, widgetId];

    updatePreferences({ hidden_widgets: newHiddenWidgets });
  };

  const reorderWidgets = (newOrder: string[]) => {
    updatePreferences({ widget_order: newOrder });
  };

  const resetPreferences = () => {
    updatePreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    loading,
    error,
    setTheme,
    setLayoutDensity,
    toggleWidget,
    reorderWidgets,
    resetPreferences,
    updatePreferences,
  };
};
