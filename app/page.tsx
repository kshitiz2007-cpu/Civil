'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2,
  ShieldCheck,
  Landmark,
  BookOpen,
  CheckCircle2,
  Scale,
  Compass,
} from 'lucide-react';
import ThemeSelector from '@/components/ThemeSelector';

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Authentication error: ' + error.message);
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
              Civil Services Portal
            </span>
          </div>
        </div>
        <ThemeSelector />
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl w-full mx-auto my-auto grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center py-8">
        {/* Left Institutional Overview */}
        <section className="space-y-6 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--app-accent)]">
            <Compass className="w-3.5 h-3.5" />
            <span>UPSC CSE Prelims & Mains Evaluation System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
            Calm, disciplined preparation for the{' '}
            <span className="text-[var(--app-accent)]">Civil Services Examination.</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--app-muted)] leading-relaxed max-w-xl">
            Designed around leading national civil services standards—featuring
            realistic Prelims negative-marking simulation, statement-level option
            elimination, bilingual English & Hindi papers, and deep cohort
            analytics.
          </p>

          <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
            <div className="theme-surface rounded-2xl p-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <Scale className="w-4 h-4 text-[var(--app-accent)]" />
                <span>UPSC Marking Discipline</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)] leading-relaxed">
                Practice with +2.00 / -0.66 (1/3rd penalty) scoring, option
                strike-through, and conviction tagging.
              </p>
            </div>
            <div className="theme-surface rounded-2xl p-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-[var(--app-secondary)]" />
                <span>Low-Fatigue Reading UI</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)] leading-relaxed">
                Switch between Ashram Sage, Vedic Parchment, and Mussoorie Mist
                for zero-glare long study sessions.
              </p>
            </div>
          </div>
        </section>

        {/* Right Sign-In Card */}
        <section className="theme-surface rounded-3xl p-7 sm:p-9 w-full max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-border)] flex items-center justify-center mb-5 text-[var(--app-accent)]">
            <Landmark className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Aspirant & Faculty Sign In
          </h2>
          <p className="text-sm text-[var(--app-muted)] mt-1.5 mb-7 leading-relaxed">
            Access your All-India Mock Tests, GS sectional diagnostics, and
            curated study compendiums.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[var(--app-text)] text-[var(--app-bg)] font-bold py-3.5 px-6 rounded-xl shadow-md hover:opacity-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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

          <div className="mt-6 space-y-2.5 border-t border-[var(--app-border)] pt-5 text-xs text-[var(--app-muted)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--app-accent)] shrink-0" />
              <span>Automatic role routing for Aspirants & Faculty Mentors</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--app-accent)] shrink-0" />
              <span>Encrypted session management via Supabase Auth</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--app-muted)] py-2 gap-2">
        <span>Gyankunj Civil Services Institution · Academic Evaluation Suite</span>
        <span>GS Paper I–IV · CSAT · All-India Test Series</span>
      </footer>
    </div>
  );
}