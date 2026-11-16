import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Shop Admin
        </p>
        <h1 className="mt-3 text-center font-serif text-4xl text-ink">
          Girl&apos;s Hood
        </h1>
        <span className="mx-auto mt-5 block h-px w-12 bg-accent/60" />
        <LoginForm />
      </div>
    </main>
  );
}
