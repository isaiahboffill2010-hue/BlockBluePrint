'use client';

import { motion } from 'framer-motion';
import { Layers, ScrollText, Sparkles } from 'lucide-react';

type FeatureIconName = 'layers' | 'scrollText' | 'sparkles';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: FeatureIconName;
}

const iconMap: Record<FeatureIconName, typeof Layers> = {
  layers: Layers,
  scrollText: ScrollText,
  sparkles: Sparkles
};

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.article
      whileHover={{ y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.75)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-[0_30px_120px_-60px_rgba(34,197,94,0.18)]"
    >
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-emerald-300 shadow-[0_18px_50px_-30px_rgba(34,197,94,0.35)] transition duration-300 group-hover:-translate-y-1">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
    </motion.article>
  );
}
