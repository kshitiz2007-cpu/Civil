'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Login failed: ' + error.message);
        return;
      }
      if (email.trim().toLowerCase() === 'admin@civilprep.in') router.push('/admin');
      else router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-[1040px] grid lg:grid-cols-[1.02fr_.98fr] gap-5 lg:gap-7 items-stretch">
        <section className="hidden lg:flex vc-shell min-h-[640px] flex-col justify-between p-10 xl:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="vc-brand-mark"><BookOpen size={25} strokeWidth={2.4} /></span>
              <div>
                <p className="text-xl font-extrabold tracking-tight">CivilPrep</p>
                <p className="vc-muted text-xs mt-1">BY GYANKUNJ ACADEMY</p>
              </div>
            </div>
            <div className="vc-gradient-bar mt-12 mb-10" />
            <span className="vc-pill"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</span>
            <h1 className="mt-7 text-5xl xl:text-[3.65rem] leading-[1.08] font-black tracking-[-.045em]">
              Prepare with
              <span className="block mt-2 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--vc-gradient)' }}>clarity.</span>
              Perform with
              <span className="block">confidence.</span>
            </h1>
            <p className="vc-muted mt-6 max-w-md text-base leading-7">
              One focused workspace for your civil services preparation — resources, practice, and progress in one place.
            </p>
          </div>
          <div>
            <div className="vc-divider mb-5" />
            <div className="flex items-center gap-3 text-sm vc-muted">
              <ShieldCheck size={18} className="text-fuchsia-300" />
              A focused, secure space for your preparation
            </div>
          </div>
        </section>

        <section className="glass-card relative overflow-hidden p-6 sm:p-9 lg:p-10 flex flex-col justify-center min-h-[570px]">
          <div className="absolute inset-x-8 top-0"><div className="vc-gradient-bar" /></div>
          <div className="absolute -right-20 top-16 h-48 w-48 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 lg:hidden mb-9">
              <span className="vc-brand-mark"><BookOpen size={24} strokeWidth={2.4} /></span>
              <div>
                <p className="text-xl font-extrabold tracking-tight">CivilPrep</p>
                <p className="vc-muted text-xs mt-1">BY GYANKUNJ ACADEMY</p>
              </div>
            </div>
            <p className="vc-eyebrow">WELCOME BACK</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">Your study space awaits.</h2>
            <p className="vc-muted mt-3 leading-6">Sign in to continue your preparation journey.</p>

            <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="vc-label">Email address</label>
                <input id="email" type="email" autoComplete="email" className="glass-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="password" className="vc-label">Password</label>
                <input id="password" type="password" autoComplete="current-password" className="glass-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="vc-button mt-2 w-full">
                {loading ? 'Signing in…' : 'Sign in to CivilPrep'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
            <div className="vc-divider my-7" />
            <div className="flex items-start gap-3 text-sm vc-muted leading-6">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-fuchsia-300" />
              <p>Your account is used to securely access your learning dashboard and saved resources.</p>
            </div>
          </div>
          <p className="relative mt-8 text-center text-xs vc-muted">© {new Date().getFullYear()} CivilPrep · Gyankunj Academy</p>
        </section>
      </div>
    </main>
  );
}
