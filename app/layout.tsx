import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Global3DBackground from "@/components/global-3d-background"
import BackgroundCompat from "@/components/background-compat"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full" data-three-bg="on">
      <head>
        <style>{`
/* Fonts */
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}

/* Ensure page background never hides the 3D canvas */
html, body { background: transparent !important; }

/* If any element still paints a solid viewport background, soften it a bit */
[data-three-bg="on"] .bg-background {
  background-color: transparent !important;
}
        `}</style>
      </head>
      <body className="min-h-screen bg-transparent text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Keeps the 3D background visible; does not alter layout */}
          <Global3DBackground />
          {/* Runtime compatibility pass for late-loading full-screen solid backgrounds */}
          <BackgroundCompat />
          {/* App content above the background */}
          <div className="relative z-20">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
