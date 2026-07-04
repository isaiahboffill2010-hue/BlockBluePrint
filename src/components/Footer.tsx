import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0B0B]">
      <div className="mx-auto max-w-[1280px] px-6 py-12 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Logo />
            <span className="text-base font-semibold">BlockBlueprint</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="text-slate-500">Privacy</span>
            <span className="text-slate-500">Terms</span>
            <span className="text-slate-500">Contact</span>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 sm:text-left">
          Copyright 2026 BlockBlueprint. Built for visionary creators who want to design, iterate, and build beautiful Minecraft worlds.
        </p>
      </div>
    </footer>
  );
}
