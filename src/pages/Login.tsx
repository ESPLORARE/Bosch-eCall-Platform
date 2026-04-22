import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, User, KeyRound } from 'lucide-react';
import BoschLogo from '../components/BoschLogo';
import { api } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register';

function passwordScore(password: string) {
  return [
    password.length >= 10,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const isRegister = mode === 'register';

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await api.register({ name, email, password, registrationCode });
      } else {
        await api.login(email, password);
      }
      onLogin();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#E20015]" />
        <div className="h-full flex-1 bg-[#005691]" />
        <div className="h-full flex-1 bg-[#00A8CB]" />
        <div className="h-full flex-1 bg-[#00884A]" />
      </div>

      <main className="grid min-h-[calc(100vh-4px)] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="p-10">
            <div className="inline-flex rounded-lg bg-white px-5 py-4 shadow-xl">
              <BoschLogo imageClassName="h-10 w-auto" />
            </div>
          </div>
          <div className="px-10 pb-12">
            <div className="mb-8 max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Secure Operations</p>
              <h1 className="text-5xl font-bold leading-tight tracking-tight">BOSCH eCall Platform</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Authenticated emergency response workspace with protected access, audited actions, and persistent backend data.
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-3">
              {[
                ['HTTP-only', 'Session cookie'],
                ['Scrypt', 'Password hash'],
                ['Audit', 'Access events'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
                <BoschLogo imageClassName="h-10 w-auto" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
              <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                {(['login', 'register'] as AuthMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => switchMode(item)}
                    className={`rounded px-4 py-2.5 text-sm font-semibold transition ${
                      mode === item
                        ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {item === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-7">
                <div className="mb-6">
                  <div className="mb-3 inline-flex rounded-md border border-blue-100 bg-blue-50 p-2 text-[#005691] dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {isRegister ? 'Create operator account' : 'Secure sign in'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {isRegister ? 'The first account becomes an administrator.' : 'Use your operator email and password.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</span>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                          placeholder="Jane Doe"
                          required
                        />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                        placeholder="operator@company.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                        placeholder="Enter password"
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  {isRegister && (
                    <>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div
                            key={index}
                            className={`h-1.5 rounded-full ${index < score ? 'bg-[#00884A]' : 'bg-slate-200 dark:bg-slate-800'}`}
                          />
                        ))}
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm password</span>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                            placeholder="Repeat password"
                            autoComplete="new-password"
                            required
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Invite code</span>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={registrationCode}
                            onChange={(event) => setRegistrationCode(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#005691] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                            placeholder="Required after first admin"
                          />
                        </div>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#005691] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#004878] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSubmitting ? 'Processing...' : isRegister ? 'Create account' : 'Sign in'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
