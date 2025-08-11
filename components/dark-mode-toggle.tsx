"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = (resolvedTheme ?? theme) === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      aria-pressed={isDark}
      data-state={isDark ? "dark" : "light"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full"
    >
      {mounted ? isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
