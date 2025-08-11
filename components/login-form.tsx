"use client"

import { useActionState, useState } from "react"
import { passwordLogin, type PasswordLoginState } from "@/server/auth-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

const initialState: PasswordLoginState = { ok: false, message: "" }

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(passwordLogin, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        {!state.ok && state.message ? (
          <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive" aria-atomic="true">
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="identifier">Username, Email, or Phone</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="e.g. tfk_abc123"
              aria-invalid={Boolean(state.fieldErrors?.identifier) || undefined}
              aria-describedby={state.fieldErrors?.identifier ? "identifier-error" : undefined}
              required
              autoComplete="username"
              disabled={isPending}
            />
            {state.fieldErrors?.identifier ? (
              <p id="identifier-error" className="text-sm text-destructive">
                {state.fieldErrors.identifier}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-xs text-muted-foreground hover:underline"
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                aria-invalid={Boolean(state.fieldErrors?.password) || undefined}
                aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
                required
                autoComplete="current-password"
                disabled={isPending}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
            {state.fieldErrors?.password ? (
              <p id="password-error" className="text-sm text-destructive">
                {state.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Signing in…" : "Login"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Login is handled securely on the server via a Server Action. If you forgot your credentials, contact your
            teacher or an administrator.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
