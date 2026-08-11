import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "./logout-button";
import {
  CONTROL_SESSION_COOKIE,
  configuredSessionSecret,
  verifyControlSession,
} from "@/lib/control-auth";

export default async function ControlPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(CONTROL_SESSION_COOKIE)?.value;
  if (!verifyControlSession(session, configuredSessionSecret())) {
    redirect("/control/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Control Panel</h1>
            <p className="text-gray-400">BlackMamba Administration</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">System Status</h3>
            <p className="text-2xl font-bold text-green-400">Active</p>
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Generations</h3>
            <p className="text-2xl font-bold">0</p>
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Last Generated</h3>
            <p className="text-lg font-medium">
              Never
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <h2 className="text-xl font-bold">Configuration</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <div>
                <p className="font-medium">Audio Generation</p>
                <p className="text-sm text-gray-400">Mock audio generation endpoint</p>
              </div>
              <span className="text-green-400 text-sm font-medium">Enabled</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <div>
                <p className="font-medium">Display Page</p>
                <p className="text-sm text-gray-400">Public display interface</p>
              </div>
              <a
                href="/display"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Visit →
              </a>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium">API Endpoint</p>
                <p className="text-sm text-gray-400">/api/generate</p>
              </div>
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="text-gray-400 text-sm">
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
}
