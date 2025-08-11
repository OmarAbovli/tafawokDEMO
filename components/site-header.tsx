import Link from "next/link"
import DarkModeToggle from "@/components/dark-mode-toggle"

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card text-xs font-bold"
          >
            T
          </span>
          <span className="text-sm font-semibold">Tafawok</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/teachers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Teachers
          </Link>
          <Link href="/photos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Photos
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-2">
          <DarkModeToggle />
        </div>
      </nav>
    </header>
  )
}

export default SiteHeader
