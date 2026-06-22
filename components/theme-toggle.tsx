"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const noopSubscribe = () => () => {};

/** true только после монтирования на клиенте — без рассинхронизации с серверным рендером */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Button variant="outline" size="icon" className="rounded-full" disabled />;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      aria-label="Переключить тему"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
