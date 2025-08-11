"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Canvas, type CanvasProps } from "@react-three/fiber"
import * as THREE from "three"

// Detect WebGL2 support safely (no Three renderer construction)
async function detectWebGL2(): Promise<boolean> {
  try {
    const canvas = document.createElement("canvas")
    const onErr = (e: Event) => e.preventDefault()
    canvas.addEventListener("webglcontextcreationerror", onErr as EventListener, { passive: false })

    const gl2 = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
      alpha: true,
      antialias: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    } as WebGLContextAttributes)

    canvas.removeEventListener("webglcontextcreationerror", onErr as EventListener)
    return Boolean(gl2)
  } catch {
    return false
  }
}

type SafeCanvasProps = Omit<CanvasProps, "children"> & {
  fallback: React.ReactNode
  children: React.ReactNode
  // Kept for API compatibility, but ignored since WebGL1 is no longer supported in three r163+
  preferLegacy?: boolean
}

export function SafeCanvas({ fallback, children, /* preferLegacy, */ ...canvasProps }: SafeCanvasProps) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [broken, setBroken] = useState(false)

  // Create a WebGL2 context first, then pass it to THREE.WebGLRenderer
  const glFactory = useMemo(() => {
    return (canvas: HTMLCanvasElement) => {
      try {
        const attrs: WebGLContextAttributes = {
          failIfMajorPerformanceCaveat: false,
          alpha: true,
          antialias: false,
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: "low-power",
        }

        const context = canvas.getContext("webgl2", attrs)
        if (!context) {
          setBroken(true)
          throw new Error("WebGL2 context creation failed")
        }

        const renderer = new THREE.WebGLRenderer({
          canvas,
          context,
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        } as any)

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
        return renderer
      } catch (e) {
        setBroken(true)
        throw e
      }
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const ok = await detectWebGL2()
      if (!alive) return
      setSupported(ok)
    })()
    return () => {
      alive = false
    }
  }, [])

  // Render fallback if detection pending, unsupported, or runtime broke
  if (supported === null || !supported || broken) {
    return <>{fallback}</>
  }

  return (
    <Canvas
      gl={glFactory as any}
      dpr={[1, 1.25]}
      shadows={false}
      frameloop="always"
      onCreated={({ gl }) => {
        try {
          const el = (gl as THREE.WebGLRenderer).domElement
          const onLost = (e: Event) => {
            e.preventDefault()
            setBroken(true)
          }
          const onCreationError = () => {
            setBroken(true)
          }
          el.addEventListener("webglcontextlost", onLost as EventListener, { passive: false })
          el.addEventListener("webglcontextcreationerror", onCreationError as EventListener, { passive: true })
        } catch {
          setBroken(true)
        }
      }}
      {...canvasProps}
    >
      {children}
    </Canvas>
  )
}
