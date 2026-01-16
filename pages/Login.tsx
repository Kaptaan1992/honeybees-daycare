import React, { useState } from 'react';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin credentials as requested
    if (username === 'admin' && password === 'honeybees2025') {
      onLogin();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-amber-200/50 border border-amber-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-amber-400 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-20 transform rotate-12">
            <img src="https://img.icons8.com/color/144/bee.png" alt="bee" className="w-48 h-48" />
          </div>
          <div className="bg-white p-4 rounded-3xl inline-block shadow-lg mb-4 relative z-10">
            <img src="https://img.icons8.com/color/48/bee.png" alt="logo" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-brand font-extrabold text-amber-900 relative z-10">Welcome Back</h1>
          <p className="text-amber-900/60 font-bold uppercase tracking-widest text-[10px] mt-1 relative z-10">Honeybees Daycare Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-slate-700 font-medium"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-slate-700 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-amber-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            <span>Login to Dashboard</span>
          </button>

          <p className="text-center text-slate-400 text-xs">
            Forgot credentials? Please contact your administrator.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;