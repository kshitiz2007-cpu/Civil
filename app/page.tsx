'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowUpRight, BookOpen, CheckCircle2, GraduationCap, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUserRoleAndRedirect = async (session: any) => {
      if (!session?.user?.email) {
        if (mounted) setCheckingAuth(false);
        return;
      }

      if (session.user.email === 'kshitiz2007@gmail.com' || session.user.email === 'admin@civilprep.in') {
        window.location.href = '/admin';
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
          window.location.href = '/dashboard';
          return;
        }

        if (mounted) {
          window.location.href = data?.role === 'admin' ? '/admin' : '/dashboard';
        }
      } catch (err) {
        console.error('Unexpected error checking role:', err);
        window.location.href = '/dashboard';
      }
    };

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) await checkUserRoleAndRedirect(session);
        else if (mounted) setCheckingAuth(false);
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) setCheckingAuth(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) checkUserRoleAndRedirect(session);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Error logging in: ' + error.message);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07111f]">
        <div className="flex flex-col items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-200" />
          </span>
          <p className="text-sm font-medium tracking-wide text-slate-400">Preparing your learning space</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#07111f] text-white selection:bg-emerald-300/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[36rem] w-[36rem] rounded-full bg-emerald-400/[.12] blur-[130px]" />
        <div className="absolute -bottom-64 right-[-8rem] h-[42rem] w-[42rem] rounded-full bg-cyan-500/[.10] blur-[140px]" />
        <div className="absolute inset-0 opacity-[.16] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
        <a href="/" className="group inline-flex items-center gap-3" aria-label="Gyankunj Academy home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-200 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/40 transition-transform group-hover:rotate-[-5deg]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight">GYANKUNJ</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">Academy</span>
          </span>
        </a>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-medium text-slate-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />
          Your next chapter starts here
        </div>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-88px)] w-full max-w-7xl items-center gap-12 px-6 pb-12 pt-5 sm:px-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-20 lg:px-12 lg:pb-20">
        <section className="mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[.07] px-3.5 py-2 text-xs font-semibold text-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            A smarter way to prepare
          </div>
          <h1 className="text-[2.75rem] font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-[4.35rem]">
            Make every
            <span className="block bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text pb-2 text-transparent">study session</span>
            count.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8 lg:mx-0">
            Your focused space for practice, progress, and better results. Pick up where you left off and move one step closer to your goals.
          </p>

          <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-3 text-left lg:mx-0">
            <div className="rounded-2xl border border-white/[.09] bg-white/[.035] p-4 backdrop-blur-sm sm:p-5">
              <span className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><BookOpen className="h-[18px] w-[18px]" /></span>
              <p className="text-sm font-semibold text-white">Practice with purpose</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Build confidence with focused mock tests.</p>
            </div>
            <div className="rounded-2xl border border-white/[.09] bg-white/[.035] p-4 backdrop-blur-sm sm:p-5">
              <span className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><CheckCircle2 className="h-[18px] w-[18px]" /></span>
              <p className="text-sm font-semibold text-white">See your progress</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Learn from every attempt and keep improving.</p>
            </div>
          </div>

          <div className="mt-9 hidden items-center gap-3 text-xs text-slate-500 lg:flex">
            <div className="flex -space-x-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#07111f] bg-emerald-200 text-[10px] font-bold text-slate-900">G</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#07111f] bg-cyan-200 text-[10px] font-bold text-slate-900">A</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#07111f] bg-indigo-200 text-[10px] font-bold text-slate-900">+</span>
            </div>
            <span>One login. Your learning space, all in one place.</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="rounded-[2rem] border border-white/[.13] bg-[#0c1b2b]/85 p-6 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-9">
            <div className="mb-8">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-emerald-200/20 to-cyan-300/10 text-emerald-100">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-200/80">Welcome to Gyankunj</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Your goals are waiting.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to access your study materials, mock tests, and learning dashboard.</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                  <ArrowUpRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[.09]" />
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">Quick & secure access</span>
              <span className="h-px flex-1 bg-white/[.09]" />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Your account stays protected</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Secure sign-in powered by Google and Supabase authentication.</p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-600">By continuing, you’ll be redirected to your personal learning dashboard.</p>
        </section>
      </div>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 border-t border-white/[.06] px-6 py-5 text-[11px] text-slate-600 sm:flex-row sm:px-10 lg:px-12">
        <span>© {new Date().getFullYear()} Gyankunj Academy</span>
        <span>Learn with focus. Grow with confidence.</span>
      </footer>
    </main>
  );
}
