'use client';

import { motion } from 'framer-motion';

export function HeroIllustration() {
  return (
    <div className="relative isolate mx-auto h-[560px] max-w-[560px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111111]/90 shadow-[0_80px_180px_-90px_rgba(0,0,0,0.85)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:48px_48px] opacity-70" />

      <motion.div
        animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-8 top-10 h-28 w-28 rounded-[2rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/15 to-transparent shadow-[0_24px_80px_-35px_rgba(34,197,94,0.35)]"
      >
        <div className="absolute inset-3 rounded-[1.5rem] bg-[#0D0D0D]/80 border border-white/10" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-10 top-20 h-32 w-32 rounded-[2.25rem] border border-white/10 bg-[#111111]/95 p-4 shadow-[0_35px_90px_-45px_rgba(34,197,94,0.35)]"
      >
        <div className="grid h-full w-full grid-cols-2 gap-3 rounded-[1.75rem] bg-gradient-to-br from-white/5 to-white/10 p-3">
          <div className="rounded-3xl bg-emerald-400/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
          <div className="rounded-3xl bg-slate-800/70" />
          <div className="rounded-3xl bg-slate-800/70" />
          <div className="rounded-3xl bg-emerald-300/15" />
        </div>
      </motion.div>

      <motion.div
        animate={{ x: [0, -8, 0], y: [0, 10, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute left-16 bottom-20 h-28 w-28 rounded-[2.5rem] border border-white/10 bg-[#0A0A0A]/95 p-4 shadow-[0_35px_90px_-45px_rgba(34,197,94,0.3)]"
      >
        <div className="flex h-full w-full items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-white/5 to-white/10">
          <div className="grid h-16 w-16 grid-cols-2 gap-2">
            <div className="rounded-2xl bg-emerald-300/20" />
            <div className="rounded-2xl bg-slate-600/15" />
            <div className="rounded-2xl bg-slate-600/15" />
            <div className="rounded-2xl bg-emerald-300/15" />
          </div>
        </div>
      </motion.div>

      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="absolute left-8 bottom-24 flex items-center gap-3">
        <div className="h-14 w-14 rounded-[1.75rem] border border-emerald-300/15 bg-[#111111]/85 shadow-[0_18px_40px_-30px_rgba(34,197,94,0.4)]" />
        <div className="h-14 w-14 rounded-[1.75rem] border border-white/10 bg-[#111111]/85 shadow-[0_18px_40px_-30px_rgba(255,255,255,0.08)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-8 h-3 w-3 rounded-full bg-emerald-400/40 blur-xl" />
        <div className="absolute right-14 top-36 h-3 w-3 rounded-full bg-emerald-300/30 blur-2xl" />
        <div className="absolute left-24 bottom-24 h-4 w-4 rounded-full bg-white/10 blur-xl" />
      </div>
    </div>
  );
}
