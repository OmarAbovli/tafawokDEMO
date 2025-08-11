import type React from "react"
import SiteHeader from "@/components/site-header"
import { Hero3DBook } from "@/components/hero-3d-book"
import { Card, CardContent } from "@/components/ui/card"
import { getFeaturedTeachers, getFeaturedVideos, getFreeVideos } from "@/server/public-queries"
import SectionHeader from "@/components/section-header"
import { BookOpenCheck, BrainCircuit, Medal, Sparkles, Star, Trophy } from "lucide-react"
import TeacherCardPro from "@/components/teacher-card-pro"
import VideoCardPro from "@/components/video-card-pro"

export default async function HomePage() {
  const [teachers, videos, free] = await Promise.all([getFeaturedTeachers(), getFeaturedVideos(), getFreeVideos()])

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />
      <Hero3DBook primaryHref="/teachers" secondaryHref="/login" />

      {/* Pillars */}
      <section className="relative border-b">
        {/* subtle gradient wash with dark variant */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div
            className="h-full w-full dark:hidden"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.10) 100%)" }}
          />
          <div
            className="hidden h-full w-full dark:block"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(8,47,35,0.35) 100%)" }}
          />
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          <InfoCard
            icon={<Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="Bite-sized lessons"
            desc="Concise videos with visual explanations to make concepts stick."
          />
          <InfoCard
            icon={<BrainCircuit className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="Active learning"
            desc="Practice as you go with tasks, goals, and progress markers."
          />
          <InfoCard
            icon={<BookOpenCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="Learn your way"
            desc="Unlock topics by month and study at the pace that fits you."
          />
        </div>
      </section>

      {/* Teachers with glossy 3D feel */}
      <section className="relative">
        <div className="py-10">
          <SectionHeader
            eyebrow="Mentors"
            title="Expert Teachers"
            subtitle="Profiles that feel human, classes that feel tailored."
          />
          {/* animated light ribbon behind grid */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-4 -z-10 h-24 overflow-hidden">
              <div className="mx-auto h-full w-[90%] rounded-full bg-gradient-to-r from-emerald-500/10 via-emerald-300/20 to-emerald-500/10 blur-2xl [animation:floatRibbon_6s_ease-in-out_infinite_alternate]" />
              <style>{`
                @keyframes floatRibbon {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(8px); }
                }
              `}</style>
            </div>
            <div className="mx-auto mt-6 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((t) => (
                <TeacherCardPro key={t.id} {...t} />
              ))}
              {teachers.length === 0 && <p className="text-sm text-muted-foreground">No teachers yet.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Latest videos */}
      <section className="py-10">
        {/* token-based surface */}
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-muted/40 px-4 py-8">
          <SectionHeader
            eyebrow="New"
            title="Latest Videos"
            subtitle="Fresh explanations, memorable visuals, and structured practice."
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCardPro
                key={v.id}
                id={v.id}
                title={v.title}
                description={v.description}
                category={v.category}
                is_free={v.is_free}
                month={v.month}
                thumbnail_url={v.thumbnail_url}
                url={v.url}
                chip="Trending"
              />
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground">No courses yet.</p>}
          </div>
        </div>
      </section>

      {/* Free videos */}
      <section className="py-10">
        <SectionHeader
          eyebrow="Start Free"
          title="Try Before You Commit"
          subtitle="Explore free lessons to get a feel for the platform."
        />
        <div className="mx-auto mt-6 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {free.map((v) => (
            <VideoCardPro
              key={v.id}
              id={v.id}
              title={v.title}
              description={v.description}
              category={v.category}
              is_free={true}
              month={v.month}
              thumbnail_url={v.thumbnail_url}
              url={v.url}
              chip="Free"
            />
          ))}
          {free.length === 0 && <p className="text-sm text-muted-foreground">No free videos yet.</p>}
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          <StatCard
            icon={<Trophy className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="60k+"
            desc="Lessons watched"
          />
          <StatCard
            icon={<Star className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="4.9/5"
            desc="Average rating"
          />
          <StatCard
            icon={<Medal className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />}
            title="Top Teachers"
            desc="Hand-picked"
          />
        </div>
      </section>
    </main>
  )
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="grid gap-2 p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-medium">{title}</div>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

function StatCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md border border-border bg-card p-2">{icon}</div>
        <div>
          <div className="text-xl font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </CardContent>
    </Card>
  )
}
