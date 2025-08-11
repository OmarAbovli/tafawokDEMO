import SiteHeader from "@/components/site-header"
import Link from "next/link"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <main>
      <SiteHeader />
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-semibold">Login to tafawok</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {
                "Use the username and password sent to you by your teacher. If you don’t have a username or password, you can get one by contacting your teacher."
              }
            </p>
            <div className="mt-6">
              <Link href="/teachers" className="text-sm underline">
                {"View Teachers — Get Your Code."}
              </Link>
            </div>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  )
}
