"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ControlPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated via session storage
    const authToken = sessionStorage.getItem("control_auth");
    if (authToken === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would verify against the server
    // For now, we'll do a simple check
    const response = await fetch("/api/control/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ secret }),
    });

    if (response.ok) {
      sessionStorage.setItem("control_auth", "authenticated");
      setIsAuthenticated(true);
    } else {
      alert("Invalid secret");
      setSecret("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("control_auth");
    setIsAuthenticated(false);
    setSecret("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Control Panel</h1>
              <p className="text-gray-400 text-sm">
                Enter the control secret to access
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Control Secret"
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Access
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Control Panel</h1>
          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">API:</span>
                <span className="text-green-400">Online</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Generations:</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Success Rate:</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/display")}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                View Display Page
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Information</h2>
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              This is the control panel for BlackMamba. From here you can
              monitor the system status and access administrative features.
            </p>
            <p className="mt-4">
              <strong className="text-white">Note:</strong> Real Suno backend
              integration is not yet implemented. This is a scaffold version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
