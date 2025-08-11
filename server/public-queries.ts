"use server"

import { sql } from "@/server/db"

export async function getFeaturedTeachers() {
  try {
    const rows = (await sql`
      SELECT id, name, subject, bio, avatar_url, phone
      FROM users
      WHERE role = 'teacher'
      ORDER BY created_at DESC
      LIMIT 6;
    `) as any[]
    return rows
  } catch {
    return [
      {
        id: "t_demo",
        name: "Demo Teacher",
        subject: "Math",
        bio: "Algebra and Geometry",
        avatar_url: "",
        phone: "+100000002",
      },
    ]
  }
}

export async function getAllTeachers() {
  try {
    const rows = (await sql`
      SELECT id, name, subject, bio, avatar_url, phone
      FROM users
      WHERE role = 'teacher'
      ORDER BY name ASC;
    `) as any[]
    return rows
  } catch {
    return [
      {
        id: "t_demo",
        name: "Demo Teacher",
        subject: "Math",
        bio: "Algebra and Geometry",
        avatar_url: "",
        phone: "+100000002",
      },
    ]
  }
}

export async function getFeaturedVideos() {
  try {
    const rows = (await sql`
      SELECT
        v.id, v.title, v.description, v.grades, v.category, v.is_free, v.month, v.thumbnail_url, v.url,
        u.id AS teacher_id, u.name AS teacher_name, u.avatar_url AS teacher_avatar_url, u.phone AS teacher_phone
      FROM videos v
      JOIN users u ON u.id = v.teacher_id
      ORDER BY v.created_at DESC
      LIMIT 6;
    `) as any[]
    return rows
  } catch {
    return [
      {
        id: "v_demo",
        title: "Introduction to Algebra",
        description: "Basics of algebraic expressions.",
        grades: [1],
        category: "Algebra",
        is_free: true,
        month: 10,
        thumbnail_url: "/course-thumbnail.png",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        teacher_id: "t_demo",
        teacher_name: "Demo Teacher",
        teacher_avatar_url: "",
        teacher_phone: "+100000002",
      },
    ]
  }
}

export async function getFreeVideos() {
  try {
    const rows = (await sql`
      SELECT
        v.id, v.title, v.description, v.category, v.month, v.thumbnail_url, v.url, v.is_free,
        u.id AS teacher_id, u.name AS teacher_name, u.avatar_url AS teacher_avatar_url, u.phone AS teacher_phone
      FROM videos v
      JOIN users u ON u.id = v.teacher_id
      WHERE v.is_free = true
      ORDER BY v.created_at DESC
      LIMIT 9;
    `) as any[]
    return rows
  } catch {
    return [
      {
        id: "v_demo",
        title: "Introduction to Algebra",
        description: "Basics of algebraic expressions.",
        category: "Algebra",
        month: 10,
        thumbnail_url: "/course-thumbnail.png",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        is_free: true,
        teacher_id: "t_demo",
        teacher_name: "Demo Teacher",
        teacher_avatar_url: "",
        teacher_phone: "+100000002",
      },
    ]
  }
}

export async function getTeacherProfile(id: string) {
  try {
    const [t] = (await sql`
      SELECT id, name, subject, bio, avatar_url, phone, theme_primary, theme_secondary
      FROM users
      WHERE id = ${id} AND role = 'teacher'
      LIMIT 1;
    `) as any[]
    if (!t) return null
    const videos = (await sql`
      SELECT id, title, description, category, is_free, month, thumbnail_url
      FROM videos
      WHERE teacher_id = ${id}
      ORDER BY created_at DESC;
    `) as any[]
    return { teacher: t, videos }
  } catch {
    if (id === "t_demo") {
      return {
        teacher: {
          id: "t_demo",
          name: "Demo Teacher",
          subject: "Math",
          bio: "Algebra and Geometry",
          avatar_url: "",
          phone: "+100000002",
          theme_primary: "#10b981",
          theme_secondary: "#14b8a6",
        },
        videos: [
          {
            id: "v_demo",
            title: "Introduction to Algebra",
            description: "Basics of algebraic expressions.",
            category: "Algebra",
            is_free: true,
            month: 10,
            thumbnail_url: "/course-thumbnail.png",
          },
        ],
      }
    }
    return null
  }
}
