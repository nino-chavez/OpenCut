"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <Button size="icon" variant="text" className={className ?? "h-7"}>
        <span className="!size-[1.1rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      size="icon"
      variant="text"
      className={className ?? "h-7"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="!size-[1.1rem]" />
      ) : (
        <Moon className="!size-[1.1rem]" />
      )}
      <span className="sr-only">
        Switch to {isDark ? "light" : "dark"} mode
      </span>
    </Button>
  );
}
