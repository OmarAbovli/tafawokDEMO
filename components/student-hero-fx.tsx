"use client"

import { useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"

function usePrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
}

export function StudentHeroFX({ name = "Student", ctaHref = "#videos" }: { name?: string; ctaHref?: string }) {
  const reduce = usePrefersReducedMotion()
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const layerARef = useRef<HTMLDivElement | null>(null)
  const layerBRef = useRef<HTMLDivElement | null>(null)

  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])

  useEffect(() => {
    if (reduce) return
    const scene = sceneRef.current
    const a = layerARef.current
    const b = layerBRef.current
    if (!scene || !a || !b) return

    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      a.style.transform = `translate(${x * 10}px, ${y * 10}px)`
      b.style.transform = `translate(${x * -14}px, ${y * -14}px)`
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [reduce])

  return (
    <div
      ref={sceneRef}
      className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      <div
        ref={layerARef}
        className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-[45%_55%_60%_40%/45%_45%_55%_55%] bg-emerald-200/60 blur-3xl"
        style={{ animation: reduce ? undefined : "blobMorph 12s ease-in-out infinite" }}
      />
      <div
        ref={layerBRef}
        className="absolute -right-24 top-24 h-[380px] w-[380px] rounded-[55%_45%_40%_60%/55%_55%_45%_45%] bg-teal-200/60 blur-3xl"
        style={{ animation: reduce ? undefined : "blobMorphAlt 14s ease-in-out infinite" }}
      />

      <div className="absolute inset-0 -z-10">
        {stars.map((i) => {
          const top = Math.random() * 100
          const left = Math.random() * 100
          const size = Math.random() * 2 + 1
          const delay = Math.random() * 4
          const duration = 3 + Math.random() * 3
          return (
            <span
              key={i}
              className="absolute rounded-full bg-emerald-400/70 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: size,
                height: size,
                animation: reduce ? undefined : `twinkle ${duration}s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          )
        })}
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
          <div className="rounded-full border bg-white/70 px-3 py-1 text-xs text-emerald-700 shadow-sm backdrop-blur">
            tafawok • Learn, grow, succeed
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Welcome, {name}</h1>
          <p className="mx-auto max-w-xl text-pretty text-sm text-slate-600">
            Explore your lessons, track your progress, and join live sessions with your teacher.
          </p>
          <a href={ctaHref}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Start Learning</Button>
          </a>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce text-xs text-slate-500">
        Scroll to your content
      </div>

      <style>
        {`
          @keyframes blobMorph {
            0% { border-radius: 45% 55% 60% 40% / 45% 45% 55% 55%; transform: scale(1); }
            50% { border-radius: 60% 40% 50% 50% / 40% 60% 40% 60%; transform: scale(1.05); }
            100% { border-radius: 45% 55% 60% 40% / 45% 45% 55% 55%; transform: scale(1); }
          }
          @keyframes blobMorphAlt {
            0% { border-radius: 55% 45% 40% 60% / 55% 55% 45% 45%; transform: scale(1); }
            50% { border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%; transform: scale(1.06); }
            100% { border-radius: 55% 45% 40% 60% / 55% 55% 45% 45%; transform: scale(1); }
          }
          @keyframes twinkle {
            0% { opacity: 0.4; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  )
}
