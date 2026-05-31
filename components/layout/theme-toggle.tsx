"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "josjobs-theme";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme: Theme = isDark ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line/50 bg-surface/35 px-4 text-sm text-ink transition hover:bg-surfaceRaised/80",
        compact ? "w-11 px-0" : "",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {compact ? null : <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
