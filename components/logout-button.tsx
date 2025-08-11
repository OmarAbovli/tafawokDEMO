"use client"

import { useTransition } from "react"
import { logout } from "@/server/auth-actions"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          await logout()
        })
      }
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  )
}
