import React, { useState } from 'react';
import { RadioTower, Lock, User } from 'lucide-react';
import BoschLogo from '../components/BoschLogo';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock login validation
    if (username && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 p-8 text-center border-b border-slate-800">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-white px-5 py-4 shadow-lg">
            <BoschLogo iconClassName="h-11 w-11" textClassName="text-[2.2rem]" />
          </div>
          <h1 className="text-2xl font-bold text-white">BOSCH eCall Platform</h1>
          <p className="text-slate-400 mt-2 text-sm">Emergency Response Dashboard</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Operator ID</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your ID"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
            >
              Secure Login
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>Authorized personnel only. All access is logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
