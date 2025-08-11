import SiteHeader from "@/components/site-header"
import { notFound } from "next/navigation"
import { getTeacherProfile } from "@/server/public-queries"
import VideoCardPro from "@/components/video-card-pro"
import { Button } from "@/components/ui/button"
import { getTeacherPhotos } from "@/server/photo-queries"
import TeacherPhotoUpload from "@/components/teacher-photo-upload"
import PhotoCard from "@/components/photo-card"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function TeacherProfilePage({ params }: { params: { id: string } }) {
  const data = await getTeacherProfile(params.id)
  if (!data) return notFound()
  const { teacher, videos } = data

  const photos = await getTeacherPhotos(params.id)
  const sessionId = cookies().get("session_id")?.value
  const me = await getCurrentUser(sessionId)
  const isOwner = !!me && me.role === "teacher" && me.id === teacher.id

  const primary = teacher.theme_primary || "#10b981"
  const secondary = teacher.theme_secondary || "#14b8a6"

  return (
    <main>
      <SiteHeader />
      <section
        className="w-full"
        style={{
          background: `radial-gradient(1200px 500px at 15% 10%, ${primary}18, transparent 60%), radial-gradient(1200px 500px at 85% 20%, ${secondary}18, transparent 60%), linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="relative overflow-hidden rounded-xl border bg-white/70 p-6 backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative h-28 w-28 overflow-hidden rounded-lg ring-2 ring-emerald-100">
                <img
                  src={teacher.avatar_url || "/placeholder.svg?height=160&width=160&query=teacher%20portrait"}
                  alt={`Photo of ${teacher.name}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold" style={{ color: primary }}>
                  {teacher.name}
                </h1>
                <p className="mt-1 text-sm text-emerald-800/80">{teacher.subject ?? "Teacher"}</p>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">{teacher.bio ?? ""}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {teacher.phone && (
                    <a
                      href={`https://wa.me/${String(teacher.phone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        "Hello, I want to join Tafawok. Can you create my student account?",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" style={{ borderColor: primary, color: primary }}>
                        Contact via WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <Decor primary={primary} secondary={secondary} />
          </div>

          <h2 className="mt-10 text-xl font-semibold">Courses</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v: any) => (
              <VideoCardPro
                key={v.id}
                id={v.id}
                title={v.title}
                description={v.description}
                category={v.category}
                is_free={v.is_free}
                month={v.month}
                thumbnail_url={v.thumbnail_url || "/course-thumbnail.png"}
                url={"/url" in v ? (v as any).url : undefined}
                chip={v.is_free ? "Free" : undefined}
              />
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground">No courses yet.</p>}
          </div>

          <h2 className="mt-12 text-xl font-semibold">Photos</h2>

          {isOwner && (
            <div className="mt-3">
              <TeacherPhotoUpload />
            </div>
          )}

          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p: any) => (
              <PhotoCard
                key={p.id}
                id={p.id}
                url={p.url}
                caption={p.caption}
                likeCount={p.like_count}
                commentCount={p.comment_count}
                likedByMe={p.liked_by_me}
                teacherName={teacher.name}
                teacherAvatarUrl={teacher.avatar_url}
              />
            ))}
            {photos.length === 0 && <p className="text-sm text-muted-foreground">No photos yet.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}

function Decor({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full blur-2xl"
        style={{ background: `${secondary}55` }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full blur-3xl"
        style={{ background: `${primary}44` }}
      />
    </>
  )
}
