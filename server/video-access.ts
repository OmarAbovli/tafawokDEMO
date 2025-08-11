"use server"

import { sql } from "@/server/db"

export type VideoRecord = {
  id: string
  title: string | null
  description: string | null
  url: string | null
  category: string | null
  is_free: boolean | null
  month: number | null
  teacher_id: string
  teacher_name: string | null
  teacher_phone: string | null
  thumbnail_url: string | null
}

export type AccessResult =
  | { allowed: true; reason?: undefined }
  | { allowed: false; reason: "login-required" | "subscribe-required" | "month-locked" | "not-found" }

export async function getVideoById(videoId: string): Promise<VideoRecord | null> {
  const rows = (await sql`
    SELECT
      v.id, v.title, v.description, v.url, v.category,
      v.is_free, v.month, v.teacher_id, v.thumbnail_url,
      u.name AS teacher_name, u.phone AS teacher_phone
    FROM videos v
    JOIN users u ON u.id = v.teacher_id
    WHERE v.id = ${videoId}
    LIMIT 1;
  `) as any[]
  if (!rows[0]) return null
  return rows[0] as VideoRecord
}

export async function getAccessForVideo(video: VideoRecord, userId?: string): Promise<AccessResult> {
  if (video.is_free) return { allowed: true }

  if (!userId) return { allowed: false, reason: "login-required" }

  const sub = (await sql`
    SELECT 1
    FROM teacher_subscriptions
    WHERE student_id = ${userId} AND teacher_id = ${video.teacher_id} AND status = 'active'
    LIMIT 1;
  `) as any[]
  if (!sub[0]) return { allowed: false, reason: "subscribe-required" }

  const month = video.month ?? null
  if (month === null) return { allowed: false, reason: "month-locked" }

  const access = (await sql`
    SELECT allowed_months
    FROM student_month_access
    WHERE student_id = ${userId} AND teacher_id = ${video.teacher_id}
    LIMIT 1;
  `) as any[]
  const allowedMonths: number[] = access[0]?.allowed_months ?? []
  if (!allowedMonths.includes(month)) return { allowed: false, reason: "month-locked" }

  return { allowed: true }
}
