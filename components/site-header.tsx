import Link from "next/link"

const SiteHeader = () => {
  return (
    <header className="bg-background">
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href="/teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Teachers
          </Link>
          <Link href="/photos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Photos
          </Link>
        </div>
        {/* rest of code here */}
      </nav>
    </header>
  )
}

export default SiteHeader
