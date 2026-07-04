'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

const navItems = [
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' }
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-white">BlockBlueprint</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 bg-[#0B0B0B]/95 px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-3xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
