"use server"

import { sql } from "@/server/db"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/auth"

async function requireTeacherId() {
  const sessionId = cookies().get("session_id")?.value
  const me = await getCurrentUser(sessionId)
  if (!me || me.role !== "teacher") {
    // Fallback for preview/demo
    return "t_demo"
  }
  return me.id
}

export async function getMyLiveStatus() {
  try {
    const teacherId = await requireTeacherId()
    const rows = (await sql`
      SELECT title, url, is_active
      FROM teacher_live_status
      WHERE teacher_id = ${teacherId}
      LIMIT 1;
    `) as any[]
    const s = rows[0]
    return {
      title: s?.title ?? "",
      url: s?.url ?? "",
      isActive: Boolean(s?.is_active ?? false),
    }
  } catch (e) {
    return { title: "", url: "", isActive: false }
  }
}

export async function setLiveStatus(input: { title?: string; url?: string; active: boolean }) {
  try {
    const teacherId = await requireTeacherId()
    await sql`
      INSERT INTO teacher_live_status (teacher_id, title, url, is_active, updated_at)
      VALUES (${teacherId}, ${input.title ?? null}, ${input.url ?? null}, ${input.active}, NOW())
      ON CONFLICT (teacher_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `
    return { ok: true as const }
  } catch (e: any) {
    console.error("setLiveStatus error", e)
    return { ok: false as const, error: e?.message ?? "DB Error" }
  }
}
