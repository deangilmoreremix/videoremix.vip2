// src/components/agentos/shell/theme.tsx
//
// The dashboard's dark/light theme. Dark is the default, as upstream. The
// choice is a per-browser convenience, so it lives in localStorage; storage
// can throw (private windows, blocked site data), so every access is guarded.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AgentOSTheme = "dark" | "light";

const STORAGE_KEY = "agentos.theme";

function readStoredTheme(): AgentOSTheme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

interface ThemeContextValue {
  theme: AgentOSTheme;
  setTheme: (theme: AgentOSTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

export const AgentOSThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AgentOSTheme>(readStoredTheme);

  const setTheme = useCallback((next: AgentOSTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The theme still applies for this visit.
    }
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAgentOSTheme = (): ThemeContextValue => useContext(ThemeContext);
