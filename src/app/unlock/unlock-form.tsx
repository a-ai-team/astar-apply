"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "./actions";

export function UnlockForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    unlock,
    {},
  );

  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-3">
      <h1 className="text-lg font-medium text-zinc-100" data-testid="unlock-heading">
        Enter the team key
      </h1>
      <input type="hidden" name="next" value={next} />
      <input
        type="password"
        name="key"
        placeholder="Team key"
        data-testid="unlock-key"
        autoFocus
        required
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-100 px-3 py-2 font-medium text-black disabled:opacity-50"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
      {(state.error ?? initialError) && (
        <p className="text-sm text-red-400" data-testid="unlock-error">
          {state.error ?? initialError}
        </p>
      )}
    </form>
  );
}
