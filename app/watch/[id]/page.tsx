import Link from "next/link"
import SiteHeader from "@/components/site-header"
import SecureVideoPlayer from "@/components/secure-video-player"
import { getVideoById, getAccessForVideo } from "@/server/video-access"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser } from "@/lib/auth"

type Props = { params: { id: string } }

function sanitizePhoneForWa(phone?: string | null) {
  if (!phone) return null
  // Remove non-digits, keep leading '+'
  const trimmed = phone.trim()
  const plus = trimmed.startsWith("+") ? "+" : ""
  const digits = trimmed.replace(/[^\d]/g, "")
  return digits ? `${plus}${digits}`.replace(/\+/g, "") : null // wa.me expects no '+'
}

function makeWaUrl(phone?: string | null, videoTitle?: string | null, teacherName?: string | null) {
  const clean = sanitizePhoneForWa(phone)
  if (!clean) return null
  const msg = `Hello ${teacherName || "Teacher"}, I would like to get access to: ${videoTitle || "your video"}.`
  const text = encodeURIComponent(msg)
  return `https://wa.me/${clean}?text=${text}`
}

export default async function WatchPage({ params }: Props) {
  const videoId = params.id
  const video = await getVideoById(videoId)
  const user = await getCurrentUser()

  if (!video) {
    return (
      <main>
        <SiteHeader />
        <div className="mx-auto max-w-4xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Video not found</CardTitle>
              <CardDescription>The requested video does not exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className="underline">
                Go back home
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const access = await getAccessForVideo(video, user?.id)
  const waUrl = makeWaUrl(video.teacher_phone, video.title, video.teacher_name)

  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {video.category ? <Badge variant="outline">{video.category}</Badge> : null}
          {typeof video.is_free === "boolean" ? (
            <Badge className={video.is_free ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
              {video.is_free ? "Free" : "Paid"}
            </Badge>
          ) : null}
          {typeof video.month === "number" ? <Badge variant="secondary">{`Month ${video.month}`}</Badge> : null}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-xl">{video.title ?? "Lesson"}</CardTitle>
            {video.description ? (
              <CardDescription className="whitespace-pre-line">{video.description}</CardDescription>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={video.thumbnail_url ? "" : ""} alt="" />
                <AvatarFallback>{video.teacher_name?.slice(0, 2).toUpperCase() || "T"}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">Uploaded by {video.teacher_name ?? "the teacher"}</span>
            </div>
          </CardHeader>
          <CardContent>
            {access.allowed ? (
              <SecureVideoPlayer
                source={video.url ?? ""}
                title={video.title ?? "Video"}
                watermarkText={user?.name ? `${user.name} • ${user.id}` : ""}
                antiDownload
                aspectRatio="16:9"
              />
            ) : (
              <AccessMessage
                reason={access.reason!}
                teacherName={video.teacher_name ?? "the teacher"}
                waUrl={waUrl ?? undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function AccessMessage({
  reason,
  teacherName,
  waUrl,
}: {
  reason: "login-required" | "subscribe-required" | "month-locked"
  teacherName: string
  waUrl?: string
}) {
  const contactButton = waUrl ? (
    <a href={waUrl} target="_blank" rel="noopener noreferrer">
      <Button className="bg-emerald-600 hover:bg-emerald-700">Contact on WhatsApp</Button>
    </a>
  ) : null

  if (reason === "login-required") {
    return (
      <div className="grid gap-3">
        <div className="rounded-md border p-3 text-sm">
          This video is paid content. Please log in with your student account that’s linked to {teacherName}, or contact
          the teacher to get access.
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/login">
            <Button variant="outline">Log in</Button>
          </Link>
          {contactButton}
        </div>
      </div>
    )
  }
  if (reason === "subscribe-required") {
    return (
      <div className="grid gap-3">
        <div className="rounded-md border p-3 text-sm">
          You don’t have an active subscription to {teacherName}. Please contact the teacher to be added.
        </div>
        <div className="flex flex-wrap gap-2">{contactButton}</div>
      </div>
    )
  }
  // month-locked
  return (
    <div className="grid gap-3">
      <div className="rounded-md border p-3 text-sm">
        Your account doesn’t have this month unlocked yet. Ask {teacherName} to unlock the month for you.
      </div>
      <div className="flex flex-wrap gap-2">{contactButton}</div>
    </div>
  )
}
