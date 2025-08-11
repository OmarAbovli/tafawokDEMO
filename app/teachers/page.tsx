import SiteHeader from "@/components/site-header"
import { getAllTeachers } from "@/server/public-queries"
import SectionHeader from "@/components/section-header"
import ClientFilters from "@/components/client-filters"

function normalize(str?: string | null) {
  return (str || "").toLowerCase()
}

export default async function TeachersPage() {
  const teachers = await getAllTeachers()
  const subjects = Array.from(new Set(teachers.map((t: any) => (t.subject || "").trim()).filter(Boolean))).slice(0, 12)

  return (
    <main>
      <SiteHeader />
      <div className="relative border-b bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <SectionHeader
            eyebrow="Mentors"
            title="Find Your Perfect Teacher"
            subtitle="Search by name or filter by subject."
          />
          <ClientFilters teachers={teachers as any[]} subjects={subjects as string[]} />
        </div>
      </div>
    </main>
  )
}
