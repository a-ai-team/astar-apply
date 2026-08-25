"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});

  if (state.sent) {
    return (
      <p className="text-center text-sm text-muted" data-testid="login-sent">
        Check <span className="text-fg">{state.email}</span> for a sign-in link.
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-3" data-testid="login-form">
      <input type="hidden" name="next" value={next} />
      <label className="text-sm text-muted" htmlFor="email">
        Email
      </label>
      <Input id="email" type="email" name="email" placeholder="you@university.ac.uk" autoFocus required />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send magic link"}
      </Button>
      {(state.error ?? initialError) && (
        <p className="text-sm text-danger" role="alert">
          {state.error ?? initialError}
        </p>
      )}
      {/* TODO(james): "Continue with Google" button once OAuth is configured. */}
    </form>
  );
}
