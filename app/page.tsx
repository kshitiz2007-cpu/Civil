'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2,
  ShieldCheck,
  Landmark,
  BookOpen,
  CheckCircle2,
  Scale,
  Compass,
  Sparkles,
  ArrowRight,
  Layers,
  Target,
} from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkUserRoleAndRedirect = async (session: any) => {
      if (!session?.user?.email) {
        if (mounted) setCheckingAuth(false);
        return;
      }

      if (
        session.user.email === 'kshitiz2007@gmail.com' ||
        session.user.email === 'admin@civilprep.in'
      ) {
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
          window.location.href = '/dashboard';
          return;
        }

        if (mounted) {
          if (data?.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        }
      } catch {
        window.location.href = '/dashboard';
      }
    };

    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          await checkUserRoleAndRedirect(session);
        } else if (mounted) {
          setCheckingAuth(false);
        }
      } catch {
        if (mounted) setCheckingAuth(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkUserRoleAndRedirect(session);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined' ? window.location.origin : '',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setAuthError(
        error?.message || 'Unable to connect to Google Auth. Use Instant Sandbox Access below.'
      );
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="app-theme min-h-screen flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--app-accent)]" />
      </div>
    );
  }

  return (
    <div className="app-theme min-h-screen flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-accent)]">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-base block leading-none">
              Gyankunj IAS
            </span>
            <span className="text-[11px] text-[var(--app-muted)] tracking-wider uppercase">
              Civil Services Evaluation Suite v3.0
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/quiz/upsc-gs1-polity-01')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-2 text-xs font-bold text-[var(--app-accent)] hover:border-[var(--app-accent)] transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Try Live CBT Engine
          </button>
          <ThemeSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl w-full mx-auto my-auto grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center py-8">
        {/* Left Institutional Overview */}
        <section className="space-y-6 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
            <Compass className="w-3.5 h-3.5" />
            <span>UPSC CSE Prelims & CSAT Computer-Based Evaluation System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12]">
            Precision OMR telemetry & calm preparation for the{' '}
            <span className="text-[var(--app-accent)]">
              Civil Services Examination.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--app-muted)] leading-relaxed max-w-xl">
            Engineered for serious UPSC aspirants—featuring interactive
            statement-level True/False deduction, 50-50 option strike-through
            with mathematical Expected Value (EV) guidance, bilingual English &
            Hindi split-view, and 360° negative-marking calibration.
          </p>

          <div className="grid sm:grid-cols-3 gap-3.5 pt-2">
            <div className="theme-surface rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Scale className="w-4 h-4 text-[var(--app-accent)]" />
                <span>+2.0 / -0.66 EV Engine</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)] leading-relaxed">
                Strike out ruled-out options and track real-time mathematical
                Expected Value on 50-50 choices.
              </p>
            </div>
            <div className="theme-surface rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Target className="w-4 h-4 text-[var(--app-secondary)]" />
                <span>Statement Deduction</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)] leading-relaxed">
                Mark individual numbered statements as True (✓) or False (✗)
                directly inside multi-statement questions.
              </p>
            </div>
            <div className="theme-surface rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Zero-Glare Themes</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)] leading-relaxed">
                Switch between Ashram Sage, Vedic Parchment, LBSNAA Mist, and
                Dholpur Dusk for 10-hour study blocks.
              </p>
            </div>
          </div>
        </section>

        {/* Right Sign-In & Instant Simulator Card */}
        <section className="theme-surface rounded-3xl p-7 sm:p-9 w-full max-w-md mx-auto">
          <div className="w-13 h-13 rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center mb-5 text-[var(--app-accent)]">
            <Landmark className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Aspirant & Faculty Portal
          </h2>
          <p className="text-xs sm:text-sm text-[var(--app-muted)] mt-1.5 mb-6 leading-relaxed">
            Sign in with Google or launch the interactive UPSC Prelims Sanctuary
            immediately.
          </p>

          {authError && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {authError}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[var(--app-text)] text-[var(--app-bg)] font-bold py-3.5 px-6 rounded-xl shadow-md hover:opacity-95 transition-all disabled:opacity-60 text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
            <span className="h-px flex-1 bg-[var(--app-border)]" />
            <span>Instant Evaluation Access</span>
            <span className="h-px flex-1 bg-[var(--app-border)]" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3 py-3 text-xs font-bold text-slate-950 hover:opacity-90 transition"
            >
              <span>Aspirant Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push('/quiz/upsc-gs1-polity-01')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3 text-xs font-bold text-[var(--app-text)] hover:border-[var(--app-accent)] transition"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--app-accent)]" />
              <span>Launch Quiz Engine</span>
            </button>
          </div>

          <div className="mt-6 space-y-2 border-t border-[var(--app-border)] pt-5 text-xs text-[var(--app-muted)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--app-accent)] shrink-0" />
              <span>Bilingual English & Devanagari Hindi CBT Interface</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--app-accent)] shrink-0" />
              <span>Full Keyboard Navigation (1–4, Shift+1–4, N/P, M, Z)</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--app-muted)] py-2 gap-2">
        <span>Gyankunj Civil Services Institution · Academic Evaluation Suite</span>
        <span>GS Paper I–IV · CSAT · All-India Prelims Simulator</span>
      </footer>
    </div>
  );
}