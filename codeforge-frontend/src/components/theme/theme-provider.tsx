"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "codeforge_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
      return;
    }

    document.documentElement.dataset.theme = "dark";
  }, []);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}