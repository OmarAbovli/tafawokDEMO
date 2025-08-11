"use server"

import { sql } from "@/server/db"

// Videos accessible to a student: from subscribed teachers and either free OR month is unlocked.
export async function getAccessibleVideos(userId: string) {
  const [user] = (await sql`SELECT id, grade FROM users WHERE id = ${userId} LIMIT 1;`) as any[]
  if (!user) return []

  // Teachers the student is subscribed to (active)
  const teacherRows = (await sql`
    SELECT teacher_id FROM teacher_subscriptions
    WHERE student_id = ${userId} AND status = 'active'
  `) as any[]
  const teacherIds = teacherRows.map((r) => r.teacher_id)
  if (teacherIds.length === 0) return []

  // Allowed months per teacher
  const accessRows = (await sql`
    SELECT teacher_id, allowed_months
    FROM student_month_access
    WHERE student_id = ${userId} AND teacher_id = ANY(${teacherIds});
  `) as any[]

  // Build a map: teacher_id -> allowed_months
  const accessMap = new Map<string, number[]>()
  for (const row of accessRows) {
    accessMap.set(row.teacher_id, row.allowed_months ?? [])
  }

  // Fetch videos for subscribed teachers, filtered by grade
  const videos = (await sql`
    SELECT id, title, description, url, category, is_free, month, teacher_id, thumbnail_url
    FROM videos
    WHERE teacher_id = ANY(${teacherIds}) AND (${user.grade} = ANY(grades))
    ORDER BY created_at DESC
  `) as any[]

  // Filter paid videos by allowed months
  const filtered = videos.filter((v) => {
    if (v.is_free) return true
    const allowed = accessMap.get(v.teacher_id) ?? []
    return allowed.includes(v.month)
  })

  return filtered
}

export async function getUpcomingLiveSessions(userId: string) {
  const [user] = (await sql`SELECT id, grade FROM users WHERE id = ${userId} LIMIT 1;`) as any[]
  if (!user) return []
  const teacherRows = (await sql`
    SELECT teacher_id FROM teacher_subscriptions
    WHERE student_id = ${userId} AND status = 'active'
  `) as any[]
  const teacherIds = teacherRows.map((r) => r.teacher_id)
  if (teacherIds.length === 0) return []
  const sessions = (await sql`
    SELECT id, title, start_at, embed_url
    FROM live_sessions
    WHERE teacher_id = ANY(${teacherIds}) AND start_at > NOW()
    ORDER BY start_at ASC
  `) as any[]
  return sessions
}

// Live NOW from teachers the student is subscribed to
export async function getActiveLiveStreams(userId: string) {
  const teacherRows = (await sql`
    SELECT teacher_id FROM teacher_subscriptions
    WHERE student_id = ${userId} AND status = 'active'
  `) as any[]
  const teacherIds = teacherRows.map((r) => r.teacher_id)
  if (teacherIds.length === 0) return []

  const rows = (await sql`
    SELECT tls.teacher_id, u.name AS teacher_name, COALESCE(tls.title, 'Live Session') AS title, tls.url
    FROM teacher_live_status tls
    JOIN users u ON u.id = tls.teacher_id
    WHERE tls.is_active = true AND tls.teacher_id = ANY(${teacherIds})
    ORDER BY tls.updated_at DESC;
  `) as any[]

  return rows as { teacher_id: string; teacher_name: string; title: string; url: string | null }[]
}
