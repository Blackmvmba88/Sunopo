"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ControlLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/control/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    setSubmitting(false);

    if (!response.ok) {
      setSecret("");
      setError(response.status === 503 ? "Control authentication is not configured." : "Invalid secret.");
      return;
    }

    router.replace("/control");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-center text-3xl font-bold">Control Panel</h1>
        <p className="mt-2 text-center text-gray-400">Authenticate to continue</p>
        <form onSubmit={login} className="mt-6 space-y-4">
          <input
            aria-label="Control secret"
            autoComplete="current-password"
            autoFocus
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3"
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            value={secret}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            className="w-full rounded-full bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
            disabled={submitting || !secret}
            type="submit"
          >
            {submitting ? "Authenticating…" : "Access Control Panel"}
          </button>
        </form>
      </div>
    </main>
  );
}
