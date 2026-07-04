'use client';

import { type FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setError('Authentication is unavailable right now.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError('Unable to sign in. Please check your email and password.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0D0D0D] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_14%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.1),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-grid opacity-25" />

      <div className="mx-auto flex min-h-screen max-w-[1280px] items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-10 shadow-[0_50px_120px_-80px_rgba(34,197,94,0.55)] backdrop-blur-2xl sm:p-14"
        >
          <div className="absolute inset-x-10 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_35%)]" />
          <div className="relative mb-10 flex items-center gap-4 rounded-[2rem] bg-white/5 px-5 py-4 shadow-[0_22px_90px_-80px_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Logo />
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">BlockBlueprint</p>
              <p className="text-lg font-semibold text-white">Secure access</p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome Back</p>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Sign in to continue designing incredible Minecraft builds with AI.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-3 w-full rounded-3xl border border-white/10 bg-[#121212]/95 px-5 py-4 text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-slate-200">
                <span>Password</span>
                <button
                  type="button"
                  disabled
                  title="Password reset is not available yet."
                  className="cursor-not-allowed text-emerald-300/60"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-3 w-full rounded-3xl border border-white/10 bg-[#121212]/95 px-5 py-4 text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/15"
                placeholder="Enter your password"
              />
            </label>

            {error ? (
              <div className="rounded-[1.75rem] border border-red-500/15 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-[#32d583] px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_24px_80px_-40px_rgba(34,197,94,0.9)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_100px_-40px_rgba(34,197,94,0.95)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-semibold text-white transition hover:text-emerald-300">
              Sign Up
            </a>
          </p>
        </motion.section>
      </div>
    </main>
  );
}
