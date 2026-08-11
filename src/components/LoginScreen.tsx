import React, { useState } from "react";
import { Lock, User, Shield, Truck, Sparkles, CheckCircle2 } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: { role: 'admin' | 'driver'; username: string; name: string; driverId?: string }) => void;
  drivers: Array<{ id: string; name: string; username?: string; vehicle: string }>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, drivers }) => {
  const [role, setRole] = useState<'admin' | 'driver'>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, isGoogle = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          username: isGoogle ? 'wangechigodfrey77@gmail.com' : username,
          password: isGoogle ? '' : password,
          isGoogle
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_50%)]"></div>
      
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LaundryOps Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Logistics & Dry Cleaning Management System</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setUsername('admin');
              setPassword('admin123');
              setError('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('driver');
              setUsername('maina');
              setPassword('rider123');
              setError('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'driver' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            Rider Portal
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {role === 'admin' ? 'Admin Username or Email' : 'Rider Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'admin' ? 'admin or email' : 'e.g. maina'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              {role === 'driver' && <span className="text-[10px] text-slate-400">Default: rider123</span>}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : `Sign in as ${role === 'admin' ? 'Administrator' : 'Delivery Rider'}`}
          </button>
        </form>

        {role === 'admin' && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={(e) => handleLogin(e, true)}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign in with Google (Admin)
            </button>
          </div>
        )}

        {role === 'driver' && drivers.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Available Rider Usernames:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {drivers.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setUsername(d.username || d.name.split(' ')[0].toLowerCase())}
                  className="bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer"
                >
                  {d.username || d.name.split(' ')[0].toLowerCase()} ({d.name})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
