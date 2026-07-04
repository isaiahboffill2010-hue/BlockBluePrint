'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';
import { Footer } from '@/components/Footer';
import { HeroIllustration } from '@/components/HeroIllustration';
import { NavBar } from '@/components/NavBar';

const features = [
  {
    title: 'AI Blueprints',
    description: 'Generate detailed structure plans in seconds with intelligent block guidance and build-ready layouts.',
    icon: 'layers' as const
  },
  {
    title: 'Step-by-Step Guides',
    description: 'Receive clear sequential instructions so every stage of your build is effortless and precise.',
    icon: 'scrollText' as const
  },
  {
    title: 'Unlimited Creativity',
    description: 'Create castles, modern homes, sky bases, and fantasy worlds with unlimited expressive freedom.',
    icon: 'sparkles' as const
  }
];

const steps = [
  {
    number: '1',
    title: 'Describe Your Build',
    description: 'Tell BlockBlueprint exactly what you want to create.'
  },
  {
    number: '2',
    title: 'AI Creates the Blueprint',
    description: 'The AI generates a custom building plan based on your prompt.'
  },
  {
    number: '3',
    title: 'Build in Minecraft',
    description: 'Follow the step-by-step instructions to recreate the design.'
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[#0D0D0D] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_14%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.1),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-grid opacity-30" />

      <NavBar />

      <section className="relative mx-auto flex min-h-screen max-w-[1280px] items-center px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid w-full gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-white/5 px-4 py-2 text-sm text-emerald-300 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
              <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(34,197,94,0.35)]" />
              AI blueprints for next-level Minecraft builds
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              Design Incredible Minecraft Builds with AI
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              Describe anything you want to build, and BlockBlueprint generates detailed blueprints with step-by-step building instructions in seconds.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <a
                href="#start"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-[#32d583] px-7 py-4 text-sm font-semibold text-slate-950 shadow-[0_24px_80px_-40px_rgba(34,197,94,0.9)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_100px_-40px_rgba(34,197,94,0.95)]"
              >
                Start Building
                <ArrowRight className="ml-3 h-4 w-4" />
              </a>
              <a
                href="#learn-more"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-300 hover:border-emerald-300/40 hover:bg-white/10"
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 hidden gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-64px_rgba(34,197,94,0.35)] backdrop-blur-xl sm:flex">
              <span className="rounded-3xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">Instant blueprints</span>
              <span className="rounded-3xl bg-slate-950/50 px-4 py-3 text-sm text-slate-300">Step-by-step guides</span>
              <span className="rounded-3xl bg-slate-950/50 px-4 py-3 text-sm text-slate-300">Build with confidence</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      <section id="learn-more" className="mx-auto max-w-[1280px] px-6 pb-24 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Feature spotlight</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Tools that make every build feel effortless.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
            BlockBlueprint turns imaginative ideas into polished blueprints and clear build instructions, so you can create bigger, faster, and with more confidence.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1280px] px-6 pb-24 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">How it works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Build with confidence in three effortless steps.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
            BlockBlueprint turns your idea into a custom blueprint and clear instructions, so you can build faster and with higher confidence.
          </p>
        </motion.div>

        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-1/2 top-10 hidden h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2 rounded-full bg-white/10 md:block" />
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="relative rounded-[2rem] border border-white/10 bg-[#121212]/95 p-8 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.85)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-400/10 text-xl font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="mx-auto max-w-[1280px] px-6 pb-24 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#151515]/95 px-8 py-16 text-center shadow-[0_50px_140px_-90px_rgba(34,197,94,0.55)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_32%)]" />
          <p className="relative text-sm uppercase tracking-[0.35em] text-emerald-300/80">Primary call to action</p>
          <h2 className="relative mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Ready to Build Something Amazing?
          </h2>
          <p className="relative mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Start creating incredible Minecraft builds with AI-powered blueprints and step-by-step instructions.
          </p>
          <a
            href="/signup"
            className="relative mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-[#32d583] px-10 py-4 text-sm font-semibold text-slate-950 shadow-[0_24px_90px_-34px_rgba(34,197,94,0.9)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:bg-emerald-300"
          >
            Start Now
          </a>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
