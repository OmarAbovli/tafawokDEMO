import { cookies } from "next/headers"
import SiteHeader from "@/components/site-header"
import { TeacherAppSidebar } from "@/components/teacher-app-sidebar"
import { TeacherVideoForm } from "@/components/teacher-video-form"
import { CreateStudentForm } from "@/components/create-student-form"
import TeacherStudentsManager from "@/components/teacher-students-manager"
import { GenerateStudentQr } from "@/components/generate-student-qr"
import { TeacherSettingsForm } from "@/components/teacher-settings-form"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/server/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import TeacherVideosManager from "@/components/teacher-videos-manager"
import { TeacherGoLive } from "@/components/teacher-go-live"
import TeacherPhotoUpload from "@/components/teacher-photo-upload"
import { ManageStudentAccess } from "@/components/manage-student-access"
import { getTeacherPhotos } from "@/server/photo-queries"
import Image from "next/image"

export default async function TeacherPage() {
  const sessionId = cookies().get("session_id")?.value
  const me = await getCurrentUser(sessionId)

  if (!me || me.role !== "teacher") {
    return (
      <main>
        <SiteHeader />
        <div className="mx-auto max-w-4xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Area</CardTitle>
              <CardDescription>Please log in with a teacher account to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  // Dashboard stats
  const [{ count: videosCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM videos WHERE teacher_id = ${me.id};
  `) as any[]
  const [{ count: studentsCount }] = (await sql`
    SELECT COUNT(DISTINCT student_id)::int AS count FROM teacher_subscriptions
    WHERE teacher_id = ${me.id} AND status = 'active';
  `) as any[]
  const nextLive = (await sql`
    SELECT title, start_at
    FROM live_sessions
    WHERE teacher_id = ${me.id} AND start_at > NOW()
    ORDER BY start_at ASC
    LIMIT 1;
  `) as any[]

  const photos = await getTeacherPhotos(me.id)

  // Initial settings
  let initial = {
    name: "",
    phone: "",
    bio: "",
    subject: "",
    avatar_url: "",
    theme_primary: "#10b981",
    theme_secondary: "#14b8a6",
  }
  const rows = (await sql`
    SELECT name, phone, bio, subject, avatar_url, theme_primary, theme_secondary
    FROM users WHERE id = ${me.id} LIMIT 1;
  `) as any[]
  if (rows[0]) {
    initial = {
      name: rows[0].name ?? "",
      phone: rows[0].phone ?? "",
      bio: rows[0].bio ?? "",
      subject: rows[0].subject ?? "",
      avatar_url: rows[0].avatar_url ?? "",
      theme_primary: rows[0].theme_primary ?? "#10b981",
      theme_secondary: rows[0].theme_secondary ?? "#14b8a6",
    }
  }

  return (
    <main id="top">
      <SiteHeader />
      <SidebarProvider>
        <TeacherAppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">Teacher Studio</h1>
              <Badge variant="outline" className="rounded">
                Welcome, {initial.name || "Teacher"}
              </Badge>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl p-4">
            {/* Dashboard */}
            <section className="grid gap-4" aria-labelledby="dashboard">
              <h2 id="dashboard" className="text-xl font-semibold">
                Dashboard
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Your Students</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{studentsCount}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Your Videos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{videosCount}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Next Live (Scheduled)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextLive[0] ? (
                      <div>
                        <p className="font-medium">{nextLive[0].title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(nextLive[0].start_at).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="my-6" />

            {/* Go Live Now */}
            <section id="live" className="grid gap-2" aria-labelledby="live-title">
              <h2 id="live-title" className="text-xl font-semibold">
                Go Live Now
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste any live link (Zoom, YouTube, etc.) and activate. Students will see a “Live Now” banner with your
                join link.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <TeacherGoLive />
                </CardContent>
              </Card>
            </section>

            <Separator className="my-6" />

            {/* Upload */}
            <section id="upload" className="grid gap-2" aria-labelledby="upload-title">
              <h2 id="upload-title" className="text-xl font-semibold">
                Upload Video
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a title, category, grades, month, and whether it’s free or paid. Free videos appear on the
                homepage automatically.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <TeacherVideoForm />
                </CardContent>
              </Card>
            </section>

            <Separator className="my-6" />

            {/* My Videos */}
            <section id="my-videos" className="grid gap-2" aria-labelledby="my-videos-title">
              <h2 id="my-videos-title" className="text-xl font-semibold">
                Your Videos
              </h2>
              <p className="text-sm text-muted-foreground">
                The videos you have uploaded. Click Edit to update the title, description, or link.
              </p>
              <div className="mt-2">
                <TeacherVideosManager />
              </div>
            </section>

            <Separator className="my-6" />

            {/* Photos */}
            <section id="photos" className="grid gap-2" aria-labelledby="photos-title">
              <h2 id="photos-title" className="text-xl font-semibold">
                Photos
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload images that will appear on your profile and in the Photos page. Include an optional caption.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <TeacherPhotoUpload />
                </CardContent>
              </Card>

              <div className="mt-4">
                {photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven’t uploaded any photos yet.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
                      >
                        <div className="aspect-square relative bg-muted">
                          <Image
                            src={p.url || "/placeholder.svg"}
                            alt={p.caption || "Teacher photo"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                        <div className="p-3">
                          {p.caption ? (
                            <p className="text-sm">{p.caption}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No caption</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <Separator className="my-6" />

            {/* Students */}
            <section id="students" className="grid gap-2" aria-labelledby="students-title">
              <h2 id="students-title" className="text-xl font-semibold">
                Create Student
              </h2>
              <p className="text-sm text-muted-foreground">
                Register a student with grade and phone numbers. You’ll get a username and password to share.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <CreateStudentForm />
                </CardContent>
              </Card>

              <div className="mt-6">
                <TeacherStudentsManager />
              </div>
            </section>

            {/* Access */}
            <Separator className="my-6" />
            <section id="access" className="grid gap-2" aria-labelledby="access-title">
              <h2 id="access-title" className="text-xl font-semibold">
                Manage Access
              </h2>
              <p className="text-sm text-muted-foreground">
                Control which grades or students can access your paid videos by month.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <ManageStudentAccess />
                </CardContent>
              </Card>
            </section>

            <Separator className="my-6" />

            {/* QR */}
            <section id="qr" className="grid gap-2" aria-labelledby="qr-title">
              <h2 id="qr-title" className="text-xl font-semibold">
                QR Login
              </h2>
              <p className="text-sm text-muted-foreground">
                Generate a one-time QR for a student to scan and be logged into their account immediately.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <GenerateStudentQr />
                </CardContent>
              </Card>
            </section>

            <Separator className="my-6" />

            {/* Settings */}
            <section id="settings" className="grid gap-2" aria-labelledby="settings-title">
              <h2 id="settings-title" className="text-xl font-semibold">
                Profile Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your name, subject, phone number, photo, description, and color theme.
              </p>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  <TeacherSettingsForm initial={initial} />
                </CardContent>
              </Card>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </main>
  )
}
