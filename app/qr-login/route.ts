import { type NextRequest, NextResponse } from "next/server"
import { consumeQrTokenCreateSessionWithRole } from "@/server/qr-actions"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/student", req.url))
  }

  // Demo path
  if (token === "demo-student") {
    const res = NextResponse.redirect(new URL("/student", req.url))
    res.cookies.set("session_id", "demo-session-student", { httpOnly: true, path: "/", sameSite: "lax" })
    return res
  }

  const session = await consumeQrTokenCreateSessionWithRole(token)
  if (!session?.id) {
    return NextResponse.redirect(new URL("/student?error=invalid-token", req.url))
  }

  const response = NextResponse.redirect(
    new URL(session.role === "teacher" ? "/teacher" : session.role === "admin" ? "/admin" : "/student", req.url),
  )
  response.cookies.set("session_id", session.id, { httpOnly: true, path: "/", sameSite: "lax" })
  return response
}
