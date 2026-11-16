"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../auth-actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm text-muted">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-ink"
        />
      </div>

      {state.error ? (
        <p id="login-error" role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-6 py-3.5 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
