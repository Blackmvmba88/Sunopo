'use client';

import { useState, useEffect } from 'react';

export default function ControlPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('control_auth');
    if (auth === 'true') {
      // Use a microtask to avoid setState during render
      Promise.resolve().then(() => setIsAuthenticated(true));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const secret = process.env.NEXT_PUBLIC_CONTROL_SECRET || 'blackmamba2024';
    
    if (secretInput === secret) {
      setIsAuthenticated(true);
      sessionStorage.setItem('control_auth', 'true');
      setError('');
    } else {
      setError('Invalid secret. Please try again.');
      setSecretInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('control_auth');
    setSecretInput('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Control Panel</h1>
              <p className="text-gray-400">Enter secret to access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter secret..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-gray-200 transition-all duration-200"
              >
                Access Control Panel
              </button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>Hint: Check .env file for the secret</p>
            </div>
          </div>
        </div>
      </div>
    );
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
          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-200 border border-zinc-700"
          >
            Logout
          </button>
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
