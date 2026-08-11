"use client";

import { useRouter } from "next/navigation";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const csrf = readCookie("sunopo_control_csrf");
    const response = await fetch("/api/control/logout", {
      method: "POST",
      headers: csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {},
    });
    if (response.ok || response.status === 401) {
      router.replace("/control/login");
      router.refresh();
    }
  }

  return (
    <button
      className="rounded-full border border-zinc-700 bg-zinc-800 px-6 py-2 font-medium text-white hover:bg-zinc-700"
      onClick={logout}
      type="button"
    >
      Logout
    </button>
  );
}
