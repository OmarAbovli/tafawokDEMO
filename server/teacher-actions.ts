"use server"

import { sql } from "@/server/db"
import { randomUUID, randomBytes } from "crypto"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getCurrentUser } from "@/lib/auth"
import { normalizeGoogleDriveUrl, isGoogleDriveUrl } from "@/lib/gdrive"
import { isYouTubeUrl, toYouTubeEmbed } from "@/lib/youtube"
import { isVimeoUrl, normalizeVimeoInput } from "@/lib/vimeo"
import { isBunnyUrl, normalizeBunnyInput, normalizeBunnyDirectPlayUrl, buildBunnyHlsUrl } from "@/lib/bunny"

export type StudentClassification = "center" | "online"

type UploadVideoInput = {
  title: string
  category: string
  description?: string
  grades: number[]
  videoUrl: string
  month: number
  isFree: boolean
  thumbnailUrl?: string
  sourceType: "gdrive" | "youtube" | "vimeo" | "bunny" | "bunny_id"
  directPlayUrl?: string
}

type CreateStudentInput = {
  name: string
  phone: string
  guardianPhone: string
  grade: number
  allowedMonths: number[]
  classification: StudentClassification
}

type UpdateTeacherSelfInput = {
  name?: string
  phone?: string
  bio?: string
  subject?: string
  avatarUrl?: string
  themePrimary?: string
  themeSecondary?: string
}

// Helpers
function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function randomUsernameStudent() {
  const token = base64Url(randomBytes(7))
  return ("st_" + token)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 14)
    .toLowerCase()
}
function randomPasswordStudent() {
  const token = base64Url(randomBytes(10))
  return token.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14)
}

async function requireTeacherId() {
  const sessionId = cookies().get("session_id")?.value
  const me = await getCurrentUser(sessionId)
  if (!me || me.role !== "teacher") {
    return "t_demo"
  }
  return me.id
}

// Auto-delete student accounts older than 14 months.
export async function cleanupExpiredStudents() {
  try {
    await sql`
      DELETE FROM users
      WHERE role = 'student'
        AND created_at < NOW() - INTERVAL '14 months';
    `
  } catch (e) {
    console.error("cleanupExpiredStudents error", e)
  }
}

function sanitizeBunnyVideoId(raw: string): string {
  return (raw || "")
    .trim()
    .replace(/[^a-z0-9-]/gi, "")
    .toLowerCase()
}

async function verifyBunnyVideoExists(libraryId: string, videoId: string): Promise<boolean> {
  const apiKey = process.env.BUNNY_STREAM_API_KEY
  if (!apiKey) return true
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
      headers: {
        accept: "application/json",
        AccessKey: apiKey,
      },
      cache: "no-store",
    })
    return res.ok
  } catch {
    return true
  }
}

export async function uploadVideo(input: UploadVideoInput) {
  try {
    const teacherId = await requireTeacherId()
    const id = "v_" + randomUUID()

    let normalizedUrl = (input.videoUrl ?? "").trim()

    if (input.sourceType === "bunny_id") {
      const videoId = sanitizeBunnyVideoId(normalizedUrl)
      const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
      if (!libraryId) {
        return { ok: false as const, error: "BUNNY_STREAM_LIBRARY_ID is not configured in the environment." }
      }
      if (!videoId) {
        return { ok: false as const, error: "Please provide a valid Bunny Video ID." }
      }

      if (input.directPlayUrl?.trim()) {
        normalizedUrl = normalizeBunnyDirectPlayUrl(input.directPlayUrl)
      } else {
        normalizedUrl = buildBunnyHlsUrl(libraryId, videoId)
      }
    } else {
      if (
        input.sourceType === "vimeo" ||
        isVimeoUrl(normalizedUrl) ||
        normalizedUrl.toLowerCase().includes("<iframe")
      ) {
        normalizedUrl = normalizeVimeoInput(normalizedUrl)
      } else if (input.sourceType === "youtube" || isYouTubeUrl(normalizedUrl)) {
        normalizedUrl = toYouTubeEmbed(normalizedUrl)
      } else if (input.sourceType === "gdrive" || isGoogleDriveUrl(normalizedUrl)) {
        normalizedUrl = normalizeGoogleDriveUrl(normalizedUrl)
      } else if (input.sourceType === "bunny" || isBunnyUrl(normalizedUrl)) {
        if (input.directPlayUrl?.trim()) {
          normalizedUrl = normalizeBunnyDirectPlayUrl(input.directPlayUrl)
        } else {
          normalizedUrl = normalizeBunnyInput(normalizedUrl)
        }
      }
    }

    await sql`
      INSERT INTO videos (id, teacher_id, title, description, grades, url, category, is_free, month, thumbnail_url)
      VALUES (
        ${id},
        ${teacherId},
        ${input.title},
        ${input.description ?? null},
        ${input.grades},
        ${normalizedUrl},
        ${input.category},
        ${input.isFree},
        ${input.month},
        ${input.thumbnailUrl ?? null}
      );
    `
    return { ok: true as const, videoId: id }
  } catch (e: any) {
    console.error("uploadVideo error", e)
    return { ok: false as const, error: e?.message ?? "DB Error" }
  }
}

export async function createStudent(input: CreateStudentInput) {
  try {
    const teacherId = await requireTeacherId()
    await cleanupExpiredStudents()

    const id = "st_" + randomUUID()

    // Generate unique username with retries
    let attempts = 0
    let username = randomUsernameStudent()
    while (attempts < 7) {
      try {
        const taken = (await sql`SELECT 1 FROM users WHERE username = ${username} LIMIT 1;`) as any[]
        if (taken[0]) {
          attempts++
          username = randomUsernameStudent()
          continue
        }
        break
      } catch {
        break
      }
    }

    const password = randomPasswordStudent()
    const passwordHash = await bcrypt.hash(password, 10)

    await sql`
      INSERT INTO users (id, role, name, phone, guardian_phone, grade, username, password_hash, classification)
      VALUES (${id}, 'student', ${input.name}, ${input.phone}, ${input.guardianPhone}, ${input.grade}, ${username}, ${passwordHash}, ${input.classification});
    `

    const subId = "sub_" + randomUUID()
    await sql`
      INSERT INTO teacher_subscriptions (id, student_id, teacher_id, status)
      VALUES (${subId}, ${id}, ${teacherId}, 'active')
      ON CONFLICT DO NOTHING;
    `
    await sql`
      INSERT INTO student_month_access (student_id, teacher_id, allowed_months)
      VALUES (${id}, ${teacherId}, ${input.allowedMonths})
      ON CONFLICT (student_id, teacher_id) DO UPDATE SET allowed_months = EXCLUDED.allowed_months;
    `
    return { ok: true as const, studentId: id, username, password }
  } catch (e: any) {
    console.error("createStudent error", e)
    return { ok: false as const, error: e?.message ?? "DB Error" }
  }
}

export async function updateStudentClassification(studentId: string, classification: StudentClassification) {
  try {
    const teacherId = await requireTeacherId()
    // Ensure teacher owns this student via subscription
    const [own] = (await sql`
      SELECT 1 FROM teacher_subscriptions
      WHERE student_id = ${studentId} AND teacher_id = ${teacherId} AND status = 'active'
      LIMIT 1;
    `) as any[]
    if (!own) return { ok: false as const, error: "Unauthorized" }

    await sql`
      UPDATE users SET classification = ${classification}
      WHERE id = ${studentId} AND role = 'student';
    `
    return { ok: true as const }
  } catch (e: any) {
    console.error("updateStudentClassification error", e)
    return { ok: false as const, error: e?.message ?? "DB Error" }
  }
}

export async function getStudentMonths(studentId: string) {
  try {
    const teacherId = await requireTeacherId()
    const rows = (await sql`
      SELECT allowed_months FROM student_month_access
      WHERE student_id = ${studentId} AND teacher_id = ${teacherId}
      LIMIT 1;
    `) as any[]
    return rows[0]?.allowed_months ?? []
  } catch {
    return []
  }
}

export async function updateStudentMonths(studentId: string, months: number[]) {
  try {
    const teacherId = await requireTeacherId()
    await sql`
      INSERT INTO student_month_access (student_id, teacher_id, allowed_months)
      VALUES (${studentId}, ${teacherId}, ${months})
      ON CONFLICT (student_id, teacher_id) DO UPDATE SET allowed_months = EXCLUDED.allowed_months;
    `
    return true
  } catch (e) {
    console.error("updateStudentMonths error", e)
    return false
  }
}

export async function updateTeacherSelf(input: UpdateTeacherSelfInput) {
  try {
    const teacherId = await requireTeacherId()
    await sql`
      UPDATE users
      SET
        name = COALESCE(${input.name}, name),
        phone = COALESCE(${input.phone}, phone),
        bio = COALESCE(${input.bio}, bio),
        subject = COALESCE(${input.subject}, subject),
        avatar_url = COALESCE(${input.avatarUrl}, avatar_url),
        theme_primary = COALESCE(${input.themePrimary}, theme_primary),
        theme_secondary = COALESCE(${input.themeSecondary}, theme_secondary)
      WHERE id = ${teacherId} AND role = 'teacher';
    `
    return true
  } catch (e) {
    console.error("updateTeacherSelf error", e)
    return false
  }
}

export async function getMyStudents() {
  try {
    const teacherId = await requireTeacherId()
    await cleanupExpiredStudents()

    const rows = (await sql`
      SELECT
        u.id,
        u.name,
        u.username,
        u.grade,
        u.phone,
        u.guardian_phone,
        u.classification,
        COALESCE(sma.allowed_months, '{}') AS allowed_months
      FROM teacher_subscriptions ts
      JOIN users u ON u.id = ts.student_id
      LEFT JOIN student_month_access sma
        ON sma.student_id = ts.student_id AND sma.teacher_id = ts.teacher_id
      WHERE ts.teacher_id = ${teacherId} AND ts.status = 'active'
      ORDER BY u.created_at DESC;
    `) as any[]

    return rows as {
      id: string
      name: string | null
      username: string | null
      grade: number | null
      phone: string | null
      guardian_phone: string | null
      classification: StudentClassification
      allowed_months: number[]
    }[]
  } catch (e) {
    console.error("getMyStudents error", e)
    return []
  }
}

// Dedicated page helpers
export async function getMyStudentsFiltered(params?: {
  classification?: "all" | StudentClassification
  q?: string
}) {
  try {
    const teacherId = await requireTeacherId()
    const classification = params?.classification ?? "all"
    const q = (params?.q ?? "").trim()
    const whereClauses: string[] = []
    if (classification !== "all") {
      whereClauses.push(`u.classification = '${classification}'`)
    }
    let searchClause = ""
    if (q) {
      searchClause = `AND (u.name ILIKE '%' || ${q} || '%' OR u.username ILIKE '%' || ${q} || '%')`
    }
    const wherePrefix = whereClauses.length > 0 ? `AND ${whereClauses.join(" AND ")}` : ""

    const rows = (await sql`
      SELECT
        u.id,
        u.name,
        u.username,
        u.grade,
        u.phone,
        u.guardian_phone,
        u.classification,
        COALESCE(sma.allowed_months, '{}') AS allowed_months
      FROM teacher_subscriptions ts
      JOIN users u ON u.id = ts.student_id
      LEFT JOIN student_month_access sma
        ON sma.student_id = ts.student_id AND sma.teacher_id = ts.teacher_id
      WHERE ts.teacher_id = ${teacherId} AND ts.status = 'active'
      ${sql.unsafe(wherePrefix)}
      ${sql.unsafe(searchClause)}
      ORDER BY u.created_at DESC;
    `) as any[]

    return rows as {
      id: string
      name: string | null
      username: string | null
      grade: number | null
      phone: string | null
      guardian_phone: string | null
      classification: StudentClassification
      allowed_months: number[]
    }[]
  } catch (e) {
    console.error("getMyStudentsFiltered error", e)
    return []
  }
}

export async function updateStudentCredentials(studentId: string, username: string, newPassword?: string) {
  try {
    const teacherId = await requireTeacherId()
    const [own] = (await sql`
      SELECT 1 FROM teacher_subscriptions
      WHERE student_id = ${studentId} AND teacher_id = ${teacherId} AND status = 'active'
      LIMIT 1;
    `) as any[]
    if (!own) return { ok: false as const, error: "Unauthorized" }

    if (newPassword && newPassword.length > 0) {
      const hash = await bcrypt.hash(newPassword, 10)
      await sql`
        UPDATE users SET username = ${username}, password_hash = ${hash}
        WHERE id = ${studentId} AND role = 'student';
      `
    } else {
      await sql`
        UPDATE users SET username = ${username}
        WHERE id = ${studentId} AND role = 'student';
      `
    }
    return { ok: true as const }
  } catch (e: any) {
    if ((e as any)?.code === "23505") {
      return { ok: false as const, error: "Username already in use" }
    }
    console.error("updateStudentCredentials error", e)
    return { ok: false as const, error: e?.message ?? "DB Error" }
  }
}

export async function getMyVideos() {
  try {
    const teacherId = await requireTeacherId()
    const rows = (await sql`
      SELECT id, title, description, url, category, is_free, month, grades, created_at
      FROM videos
      WHERE teacher_id = ${teacherId}
      ORDER BY created_at DESC;
    `) as any[]
    return rows as {
      id: string
      title: string | null
      description: string | null
      url: string | null
      category: string | null
      is_free: boolean | null
      month: number | null
      grades: number[] | null
      created_at: string
    }[]
  } catch (e) {
    console.error("getMyVideos error", e)
    return []
  }
}

export async function updateVideo(
  videoId: string,
  updates: { title?: string; description?: string; url?: string },
): Promise<{ ok: true } | { ok: false; error?: string }> {
  try {
    const teacherId = await requireTeacherId()
    let url = updates.url
    if (url) {
      if (isYouTubeUrl(url)) url = toYouTubeEmbed(url)
      else if (isGoogleDriveUrl(url)) url = normalizeGoogleDriveUrl(url)
      else if (isVimeoUrl(url)) url = normalizeVimeoInput(url)
      else if (isBunnyUrl(url)) url = normalizeBunnyInput(url)
    }
    const rows = (await sql`
      UPDATE videos
      SET
        title = COALESCE(${updates.title}, title),
        description = COALESCE(${updates.description}, description),
        url = COALESCE(${url}, url)
      WHERE id = ${videoId} AND teacher_id = ${teacherId}
      RETURNING id;
    `) as any[]
    if (!rows[0]) return { ok: false, error: "Not found or unauthorized" }
    return { ok: true }
  } catch (e: any) {
    console.error("updateVideo error", e)
    return { ok: false, error: e?.message ?? "DB Error" }
  }
}

export async function deleteVideo(videoId: string): Promise<{ ok: true } | { ok: false; error?: string }> {
  try {
    const teacherId = await requireTeacherId()
    const rows = (await sql`
      DELETE FROM videos
      WHERE id = ${videoId} AND teacher_id = ${teacherId}
      RETURNING id;
    `) as any[]
    if (!rows[0]) {
      return { ok: false, error: "Not found or unauthorized" }
    }
    return { ok: true }
  } catch (e: any) {
    console.error("deleteVideo error", e)
    return { ok: false, error: e?.message ?? "DB Error" }
  }
}

export async function bulkUpdateMonthsForClassification(
  months: number[],
  classification: "center" | "online",
): Promise<{ ok: true; updatedCount: number } | { ok: false; error?: string }> {
  try {
    const teacherId = await requireTeacherId()

    // Find all student IDs for this teacher with the specified classification
    const rows = (await sql`
      SELECT u.id
      FROM teacher_subscriptions ts
      JOIN users u ON u.id = ts.student_id
      WHERE ts.teacher_id = ${teacherId}
        AND ts.status = 'active'
        AND u.classification = ${classification};
    `) as { id: string }[]

    if (!rows || rows.length === 0) {
      return { ok: true, updatedCount: 0 }
    }

    // Upsert allowed months for each student for this teacher
    let updatedCount = 0
    for (const r of rows) {
      await sql`
        INSERT INTO student_month_access (student_id, teacher_id, allowed_months)
        VALUES (${r.id}, ${teacherId}, ${months})
        ON CONFLICT (student_id, teacher_id)
        DO UPDATE SET allowed_months = EXCLUDED.allowed_months;
      `
      updatedCount++
    }

    return { ok: true, updatedCount }
  } catch (e: any) {
    console.error("bulkUpdateMonthsForClassification error", e)
    return { ok: false, error: e?.message ?? "DB Error" }
  }
}

export async function updateStudentAll(params: {
  studentId: string
  name?: string
  phone?: string
  guardianPhone?: string
  grade?: number
  classification?: "center" | "online"
  username?: string
  newPassword?: string
  months?: number[]
}): Promise<{ ok: true } | { ok: false; error?: string }> {
  try {
    const teacherId = await requireTeacherId()

    // Ensure teacher owns this student via subscription
    const [own] = (await sql`
      SELECT 1 FROM teacher_subscriptions
      WHERE student_id = ${params.studentId} AND teacher_id = ${teacherId} AND status = 'active'
      LIMIT 1;
    `) as any[]
    if (!own) return { ok: false, error: "Unauthorized" }

    // Update core details and classification
    await sql`
      UPDATE users
      SET
        name = COALESCE(${params.name}, name),
        phone = COALESCE(${params.phone}, phone),
        guardian_phone = COALESCE(${params.guardianPhone}, guardian_phone),
        grade = COALESCE(${params.grade}, grade),
        classification = COALESCE(${params.classification}, classification)
      WHERE id = ${params.studentId} AND role = 'student';
    `

    // Update username/password if provided
    if (params.username || params.newPassword) {
      if (params.newPassword && params.newPassword.length > 0) {
        const hash = await bcrypt.hash(params.newPassword, 10)
        await sql`
          UPDATE users
          SET
            ${params.username ? sql`username = ${params.username},` : sql``}
            password_hash = ${hash}
          WHERE id = ${params.studentId} AND role = 'student';
        `
      } else if (params.username) {
        await sql`
          UPDATE users
          SET username = ${params.username}
          WHERE id = ${params.studentId} AND role = 'student';
        `
      }
    }

    // Update allowed months if provided
    if (params.months) {
      await sql`
        INSERT INTO student_month_access (student_id, teacher_id, allowed_months)
        VALUES (${params.studentId}, ${teacherId}, ${params.months})
        ON CONFLICT (student_id, teacher_id)
        DO UPDATE SET allowed_months = EXCLUDED.allowed_months;
      `
    }

    return { ok: true }
  } catch (e: any) {
    if (e?.code === "23505") {
      return { ok: false, error: "Username already in use" }
    }
    console.error("updateStudentAll error", e)
    return { ok: false, error: e?.message ?? "DB Error" }
  }
}

export async function getMyStudentsAdvanced(filters?: {
  grades?: number[]
  classifications?: ("center" | "online")[]
  q?: string
}) {
  const all = await getMyStudents()
  const grades = filters?.grades ?? []
  const classes = filters?.classifications ?? []
  const q = (filters?.q ?? "").trim().toLowerCase()

  return all.filter((s: any) => {
    const matchGrade = grades.length === 0 || (s.grade != null && grades.includes(Number(s.grade)))
    const cls = (s.classification ?? "center") as "center" | "online"
    const matchClass = classes.length === 0 || classes.includes(cls)
    const matchQ =
      !q ||
      [s.name, s.username, s.id, s.phone, s.guardian_phone]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    return matchGrade && matchClass && matchQ
  })
}

export async function addExistingStudentToTeacher(params: {
  studentId: string
  classification?: "center" | "online"
  months?: number[]
}): Promise<{ ok: true } | { ok: false; error?: string }> {
  try {
    const teacherId = await requireTeacherId()

    // 1) Ensure the student exists
    const studentRows = (await sql`
      SELECT id FROM users
      WHERE id = ${params.studentId} AND role = 'student'
      LIMIT 1;
    `) as { id: string }[]
    if (!studentRows?.[0]) {
      return { ok: false, error: "Student not found" }
    }

    // 2) Ensure a teacher_subscriptions link exists (active)
    const subId = "sub_" + randomUUID()
    await sql`
      INSERT INTO teacher_subscriptions (id, student_id, teacher_id, status)
      VALUES (${subId}, ${params.studentId}, ${teacherId}, 'active')
      ON CONFLICT DO NOTHING;
    `

    // 3) Optionally update the student's classification (global)
    if (params.classification) {
      await sql`
        UPDATE users
        SET classification = ${params.classification}
        WHERE id = ${params.studentId} AND role = 'student';
      `
    }

    // 4) Optionally set/overwrite allowed months for THIS teacher
    if (params.months) {
      await sql`
        INSERT INTO student_month_access (student_id, teacher_id, allowed_months)
        VALUES (${params.studentId}, ${teacherId}, ${params.months})
        ON CONFLICT (student_id, teacher_id)
        DO UPDATE SET allowed_months = EXCLUDED.allowed_months;
      `
    }

    return { ok: true }
  } catch (e: any) {
    console.error("addExistingStudentToTeacher error", e)
    return { ok: false, error: e?.message ?? "DB Error" }
  }
}
