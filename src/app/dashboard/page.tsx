'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Eye,
  FileText,
  Folder,
  Layers3,
  ListChecks,
  LogOut,
  Map,
  Package,
  Plus,
  Settings,
  Sparkles,
  UserCircle
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { getSupabaseClient } from '@/lib/supabase';

const PROMPT_LIMIT = 1000;
const SUGGESTIONS = [
  'Medieval Castle',
  'Modern House',
  'Japanese Temple',
  'Wizard Tower',
  'Village',
  'Beach House',
  'Survival Base',
  'Futuristic City'
];
const BLUEPRINT_VIEWS = ['Perspective', 'Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (contentType.includes('application/json')) {
    return text ? JSON.parse(text) : {};
  }

  console.error('Expected JSON API response but received:', text.slice(0, 500));
  return {
    type: 'conversation',
    message: 'Unable to reach BlockBlueprint right now. Please refresh and try again.'
  };
}

interface BlueprintSection {
  title: string;
  status?: string;
  estimated_time?: string;
  blocks?: number;
  overview?: string;
  diagram_url?: string | null;
  layers?: Array<{ title: string; blocks?: number; overview?: string }>;
}

interface BlueprintData {
  id: string;
  project_id?: string | null;
  name: string | null;
  prompt: string;
  status: string;
  blueprint_data: {
    name?: string;
    difficulty?: string;
    estimated_build_time?: string;
    block_count?: number;
    dimensions?: string;
    style?: string;
    biome_recommendation?: string;
    description?: string;
    overview?: string;
    preview_image_url?: string | null;
    image_generation_status?: 'pending' | 'ready' | 'failed';
    image_generation_error?: string | null;
    materials?: Array<{ label: string; count: number }>;
    sections?: BlueprintSection[];
    views?: Partial<Record<string, string | null>>;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<BlueprintData[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('Perspective');
  const [expandedSectionIndex, setExpandedSectionIndex] = useState(0);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const supabase = useMemo(() => getSupabaseClient(), []);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!supabase) {
        throw new Error('Authentication client unavailable');
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('You must be signed in to access blueprints');
      }

      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(options.headers ?? {})
        }
      });
    },
    [supabase]
  );

  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      setError('');

      try {
        const response = await fetchWithAuth('/api/blueprints');
        const result = await readApiResponse(response);

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load blueprints.');
        }

        const blueprints: BlueprintData[] = result.blueprints ?? [];
        setProjects(blueprints);
        setSelectedBlueprint(blueprints[0] ?? null);
      } catch (fetchError) {
        console.error('Blueprint load failed:', fetchError);
        setError('Unable to load your blueprints right now. Please try again.');
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, [fetchWithAuth]);

  const activeBlueprint = selectedBlueprint;
  const blueprintContent = activeBlueprint?.blueprint_data ?? null;
  const sections = blueprintContent?.sections ?? [];
  const materials = blueprintContent?.materials ?? [];
  const projectCount = projects.length;
  const viewKey = activeView.toLowerCase();
  const activeViewUrl =
    blueprintContent?.views?.[activeView] ?? blueprintContent?.views?.[viewKey] ?? blueprintContent?.preview_image_url ?? null;
  const hasGeneratedWorkspace = Boolean(activeBlueprint && blueprintContent);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    setSaving(true);
    setError('');

    try {
      const currentProjectId = selectedBlueprint?.project_id ?? null;
      const outgoingMessage = prompt.trim();
      setChatMessages((current) => [...current, { role: 'user', content: outgoingMessage }]);

      const response = await fetchWithAuth('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: outgoingMessage,
          projectId: currentProjectId,
          conversationId
        })
      });

      const result = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Unable to process your message. Please try again.');
      }

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      if (result.type === 'conversation') {
        setChatMessages((current) => [...current, { role: 'assistant', content: result.message }]);
      }

      if (result.type === 'blueprint' && result.project) {
        const blueprintData: BlueprintData = result.project;
        setProjects((current) => {
          const withoutUpdated = current.filter((project) => project.id !== blueprintData.id);
          return [blueprintData, ...withoutUpdated];
        });
        setSelectedBlueprint(blueprintData);
        setActiveView('Perspective');
        setExpandedSectionIndex(0);
        setChatMessages((current) => [
          ...current,
          { role: 'assistant', content: `Created ${result.title}. Opening the build guide now.` }
        ]);
      }

      setPrompt('');
      promptInputRef.current?.blur();
    } catch (fetchError) {
      console.error('Blueprint generation failed:', fetchError);
      setError('Unable to generate your blueprint. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase?.auth.signOut();
      window.location.href = '/login';
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
      setError('Unable to log out right now. Please try again.');
    }
  }

  async function handleRetryImages(blueprintId: string) {
    setSaving(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/blueprints/${blueprintId}/images`, {
        method: 'POST'
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(result?.message || 'Unable to generate blueprint images. Please try again.');
      }

      const blueprintData: BlueprintData = result.blueprint;
      setProjects((current) => current.map((project) => (project.id === blueprintData.id ? blueprintData : project)));
      setSelectedBlueprint(blueprintData);
      console.log('[BlockBlueprint image] ✓ Frontend loaded image', {
        blueprintId,
        hasPerspective: Boolean(blueprintData.blueprint_data?.preview_image_url)
      });
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : 'Unable to generate blueprint images. Please try again.';
      console.error('[BlockBlueprint image] Frontend retry failed:', retryError);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function startNewBlueprint() {
    setSelectedBlueprint(null);
    setError('');
    requestAnimationFrame(() => promptInputRef.current?.focus());
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b0e] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-hero-grid opacity-[0.13]" />

      <div
        className={`relative mx-auto grid min-h-screen max-w-[1880px] grid-cols-1 gap-4 p-3 sm:p-5 ${
          hasGeneratedWorkspace
            ? 'xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)]'
            : 'xl:grid-cols-[250px_minmax(0,1fr)_390px] 2xl:grid-cols-[270px_minmax(0,1fr)_440px]'
        }`}
      >
        <Sidebar
          projects={projects}
          activeBlueprint={activeBlueprint}
          loading={loadingProjects}
          projectCount={projectCount}
          onSelect={(project) => {
            setSelectedBlueprint(project);
            setActiveView('Perspective');
            setExpandedSectionIndex(0);
          }}
          onNew={startNewBlueprint}
          onLogout={handleLogout}
        />

        <section className="min-w-0 space-y-5">
          {activeBlueprint && blueprintContent ? (
            <GeneratedWorkspace
              blueprint={activeBlueprint}
              activeView={activeView}
              activeViewUrl={activeViewUrl}
              sections={sections}
              materials={materials}
              prompt={prompt}
              saving={saving}
              error={error}
              chatMessages={chatMessages}
              promptInputRef={promptInputRef}
              expandedSectionIndex={expandedSectionIndex}
              onPromptChange={(value) => setPrompt(value.slice(0, PROMPT_LIMIT))}
              onGenerate={handleGenerate}
              onViewChange={setActiveView}
              onSectionChange={setExpandedSectionIndex}
              onRetryImages={handleRetryImages}
            />
          ) : (
            <OnboardingWorkspace
              prompt={prompt}
              saving={saving}
              error={error}
              chatMessages={chatMessages}
              promptInputRef={promptInputRef}
              onPromptChange={(value) => setPrompt(value.slice(0, PROMPT_LIMIT))}
              onGenerate={handleGenerate}
            />
          )}
        </section>

        <RightPanel hidden={hasGeneratedWorkspace} />
      </div>
    </main>
  );
}

function Sidebar({
  projects,
  activeBlueprint,
  loading,
  projectCount,
  onSelect,
  onNew,
  onLogout
}: {
  projects: BlueprintData[];
  activeBlueprint: BlueprintData | null;
  loading: boolean;
  projectCount: number;
  onSelect: (project: BlueprintData) => void;
  onNew: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1015]/82 shadow-[0_24px_120px_-70px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:min-h-[calc(100vh-2.5rem)]">
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12 rounded-2xl" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">BlockBlueprint</p>
            <p className="text-xs text-slate-200">AI Blueprint Studio</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-gradient-to-b from-emerald-400 to-emerald-600 text-sm font-semibold text-white shadow-[0_18px_50px_-24px_rgba(16,185,129,0.95)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-28px_rgba(16,185,129,0.95)]"
        >
          <Plus className="h-5 w-5" />
          New Blueprint
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Your Blueprints</p>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400">{projectCount}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-[72px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.04]" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/18 px-6 text-center">
              <Folder className="mb-5 h-8 w-8 text-slate-500" />
              <p className="font-semibold text-slate-200">No blueprints yet.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Create your first blueprint to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelect(project)}
                  className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                    activeBlueprint?.id === project.id
                      ? 'border-emerald-300/35 bg-emerald-400/[0.09]'
                      : 'border-white/10 bg-white/[0.035] hover:border-emerald-300/25 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-white">{project.name ?? project.blueprint_data?.name ?? project.prompt}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{formatProjectDate(project.updated_at ?? project.created_at)}</span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 uppercase tracking-[0.14em] text-slate-400">{project.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="space-y-1">
          <SidebarAction icon={<Settings className="h-5 w-5" />} label="Settings" disabled />
          <SidebarAction icon={<UserCircle className="h-5 w-5" />} label="Account" disabled />
          <SidebarAction icon={<LogOut className="h-5 w-5" />} label="Logout" onClick={onLogout} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.035] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <UserCircle className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">You</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}

function SidebarAction({
  icon,
  label,
  disabled,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-100 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
    >
      {icon}
      {label}
    </button>
  );
}

function OnboardingWorkspace({
  prompt,
  saving,
  error,
  chatMessages,
  promptInputRef,
  onPromptChange,
  onGenerate
}: {
  prompt: string;
  saving: boolean;
  error: string;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  promptInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onPromptChange: (value: string) => void;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="flex min-h-[calc(100vh-1.5rem)] flex-col justify-center rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-6 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:min-h-[calc(100vh-2.5rem)] sm:p-10 lg:p-14"
    >
      <div className="mx-auto w-full max-w-[760px]">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.32em] text-emerald-300/80">AI Blueprint Studio</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">What would you like to build?</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Describe your dream Minecraft build and BlockBlueprint will design a complete blueprint with step-by-step instructions.
        </p>

        <form onSubmit={onGenerate} className="mt-8 space-y-5">
          <div className="relative">
            <textarea
              ref={promptInputRef}
              rows={8}
              maxLength={PROMPT_LIMIT}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Build me a medieval castle with four towers and a moat..."
              className="min-h-[220px] w-full resize-none rounded-2xl border border-white/12 bg-black/24 px-5 py-5 text-base leading-7 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-slate-600 focus:border-emerald-300/45 focus:ring-4 focus:ring-emerald-400/10"
            />
            <span className="absolute bottom-4 right-5 text-xs text-slate-500">
              {prompt.length} / {PROMPT_LIMIT}
            </span>
          </div>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={saving || !prompt.trim()}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-emerald-300/25 bg-gradient-to-b from-emerald-400 to-emerald-600 text-sm font-semibold text-white shadow-[0_22px_70px_-30px_rgba(16,185,129,0.95)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {saving ? 'Generating Blueprint...' : 'Generate Blueprint'}
          </motion.button>

          {error ? <p className="rounded-xl border border-rose-400/15 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </form>

        {chatMessages.length ? (
          <div className="mt-7 max-h-[260px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/16 p-4">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user' ? 'ml-auto max-w-[86%] bg-emerald-400/12 text-emerald-50' : 'mr-auto max-w-[86%] bg-white/[0.045] text-slate-300'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          <p className="mb-4 text-sm text-slate-500">Try these ideas</p>
          <div className="flex flex-wrap gap-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onPromptChange(suggestion)}
                className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-slate-300 transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-emerald-400/[0.08] hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RightPanel({ hidden }: { hidden: boolean }) {
  if (hidden) return null;

  return (
    <aside className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-4 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl xl:min-h-[calc(100vh-2.5rem)]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/24">
        <OnboardingPreview />
        <div className="space-y-6 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-emerald-300">How it works</h2>
          <HowItWorksStep icon={<FileText className="h-4 w-4" />} title="1. Describe Your Build" text="Tell us what you want to build in Minecraft." />
          <HowItWorksStep
            icon={<Box className="h-4 w-4" />}
            title="2. AI Generates Blueprint"
            text="BlockBlueprint creates detailed materials and step-by-step sections."
          />
          <HowItWorksStep icon={<CheckCircle2 className="h-4 w-4" />} title="3. Build Step-by-Step" text="Follow the generated plan layer by layer." />
        </div>
      </div>
    </aside>
  );
}

function OnboardingPreview() {
  return (
    <div className="relative aspect-[1.5] overflow-hidden bg-black/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/house.png" alt="Minecraft house preview" className="h-full w-full object-cover" />
    </div>
  );
}

function HowItWorksStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/12 text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="font-medium text-slate-100">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function GeneratedWorkspace({
  blueprint,
  activeView,
  activeViewUrl,
  sections,
  materials,
  prompt,
  saving,
  error,
  chatMessages,
  promptInputRef,
  expandedSectionIndex,
  onPromptChange,
  onGenerate,
  onViewChange,
  onSectionChange,
  onRetryImages
}: {
  blueprint: BlueprintData;
  activeView: string;
  activeViewUrl: string | null;
  sections: BlueprintSection[];
  materials: Array<{ label: string; count: number }>;
  prompt: string;
  saving: boolean;
  error: string;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  promptInputRef: React.RefObject<HTMLTextAreaElement | null>;
  expandedSectionIndex: number;
  onPromptChange: (value: string) => void;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
  onViewChange: (view: string) => void;
  onSectionChange: (index: number) => void;
  onRetryImages: (blueprintId: string) => void;
}) {
  const content = blueprint.blueprint_data;
  if (!content) return null;

  const overviewItems = [
    { label: 'Difficulty', value: content.difficulty, icon: <Compass className="h-4 w-4" /> },
    { label: 'Build Time', value: content.estimated_build_time, icon: <Clock3 className="h-4 w-4" /> },
    { label: 'Block Count', value: typeof content.block_count === 'number' ? content.block_count.toLocaleString() : undefined, icon: <Package className="h-4 w-4" /> },
    { label: 'Dimensions', value: content.dimensions, icon: <Map className="h-4 w-4" /> },
    { label: 'Style', value: content.style, icon: <Layers3 className="h-4 w-4" /> },
    { label: 'Biome', value: content.biome_recommendation, icon: <Box className="h-4 w-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="space-y-5"
    >
      <section className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-5 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Generated Blueprint
              </span>
              <span className="text-sm text-slate-500">Last edited {formatProjectDate(blueprint.updated_at ?? blueprint.created_at)}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{content.name ?? blueprint.name ?? 'Untitled Blueprint'}</h1>
            <p className="mt-4 max-w-5xl text-base leading-7 text-slate-400">{content.description ?? content.overview ?? 'No description was returned for this blueprint.'}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {overviewItems.map((item) => (
                <InfoTile key={item.label} icon={item.icon} label={item.label} value={item.value ?? 'Not provided'} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Progress</p>
              <span className="text-xs text-slate-500">{getProgressLabel(sections)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: getProgressWidth(sections) }} />
            </div>
            <div className="mt-6 grid gap-3">
              <InfoTile icon={<ListChecks className="h-4 w-4" />} label="Sections" value={sections.length ? `${sections.length} returned` : 'No sections yet'} />
              <InfoTile icon={<Package className="h-4 w-4" />} label="Materials" value={materials.length ? `${materials.length} listed` : 'No materials yet'} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-5 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7">
          <div className="mb-5 flex flex-wrap gap-2">
            {BLUEPRINT_VIEWS.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onViewChange(view)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeView === view
                    ? 'bg-emerald-400 text-slate-950'
                    : 'border border-white/10 bg-white/[0.035] text-slate-400 hover:border-emerald-300/25 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <ImageStagePanel
            imageUrl={activeViewUrl}
            imageStatus={content.image_generation_status}
            imageError={content.image_generation_error}
            label={`${activeView} blueprint view`}
            onRetry={() => onRetryImages(blueprint.id)}
          />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-5 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Materials</h2>
          {materials.length ? (
            <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 2xl:grid-cols-1">
              {materials.map((material) => (
                <div key={`${material.label}-${material.count}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <span className="text-sm text-slate-300">{material.label}</span>
                  <span className="text-sm font-semibold text-emerald-300">{material.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Package className="h-7 w-7" />} title="No materials returned" text="Generated material lists will appear here." />
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-5 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7">
        <h2 className="text-xl font-semibold text-white">Ask BlockBlueprint</h2>
        <p className="mt-2 text-sm text-slate-500">Ask a question or request a change to this blueprint.</p>

        {chatMessages.length ? (
          <div className="mt-5 max-h-[220px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/16 p-4">
            {chatMessages.slice(-8).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user' ? 'ml-auto max-w-[86%] bg-emerald-400/12 text-emerald-50' : 'mr-auto max-w-[86%] bg-white/[0.045] text-slate-300'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
        ) : null}

        <form onSubmit={onGenerate} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <textarea
            ref={promptInputRef}
            rows={2}
            maxLength={PROMPT_LIMIT}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Ask a question or modify this blueprint..."
            className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/12 bg-black/24 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-300/45 focus:ring-4 focus:ring-emerald-400/10"
          />
          <button
            type="submit"
            disabled={saving || !prompt.trim()}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Send
          </button>
        </form>
        {error ? <p className="mt-3 rounded-xl border border-rose-400/15 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0d1217]/78 p-5 shadow-[0_24px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7">
        <h2 className="text-xl font-semibold text-white">Build Sections</h2>
        <p className="mt-2 text-sm text-slate-500">Open one construction phase at a time.</p>

        {sections.length ? (
          <div className="mt-6 grid gap-3 xl:grid-cols-2">
            {sections.map((section, index) => (
              <SectionAccordion
                key={`${section.title}-${index}`}
                section={section}
                index={index}
                expanded={expandedSectionIndex === index}
                onToggle={() => onSectionChange(expandedSectionIndex === index ? -1 : index)}
                imageStatus={content.image_generation_status}
                imageError={content.image_generation_error}
                onRetryImages={() => onRetryImages(blueprint.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState icon={<Layers3 className="h-7 w-7" />} title="No sections returned" text="Construction phases from the backend will appear here." />
          </div>
        )}
      </section>
    </motion.div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">{icon}</div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function ImageStagePanel({
  imageUrl,
  imageStatus,
  imageError,
  label,
  minHeight = 'min-h-[420px]',
  onRetry
}: {
  imageUrl?: string | null;
  imageStatus?: 'pending' | 'ready' | 'failed';
  imageError?: string | null;
  label: string;
  minHeight?: string;
  onRetry: () => void;
}) {
  if (imageUrl) {
    return (
      <div className={`relative flex ${minHeight} items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/25`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={label}
          className="relative h-full max-h-[620px] w-full object-contain p-3"
          onLoad={() => console.log('[BlockBlueprint image] ✓ Frontend loaded image', { label })}
          onError={(event) => {
            console.error('[BlockBlueprint image] Frontend image failed to load:', {
              label,
              src: event.currentTarget.currentSrc || imageUrl
            });
          }}
        />
      </div>
    );
  }

  if (imageStatus === 'failed') {
    return (
      <div className={`relative flex ${minHeight} items-center justify-center overflow-hidden rounded-3xl border border-rose-400/20 bg-rose-400/8`}>
        <div className="max-w-md px-6 text-center">
          <Eye className="mx-auto mb-5 h-10 w-10 text-rose-200" />
          <p className="font-semibold text-rose-100">Image generation failed.</p>
          <p className="mt-2 text-sm leading-6 text-rose-100/75">{imageError || 'No error details were returned.'}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-950 transition hover:bg-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex ${minHeight} items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/25`}>
      <div className="absolute inset-0 bg-hero-grid opacity-20" />
      <div className="relative px-6 text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
        <p className="font-semibold text-slate-200">Generating image...</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">BlockBlueprint is creating the {label.toLowerCase()}.</p>
      </div>
    </div>
  );
}

function SectionAccordion({
  section,
  index,
  expanded,
  onToggle,
  imageStatus,
  imageError,
  onRetryImages
}: {
  section: BlueprintSection;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  imageStatus?: 'pending' | 'ready' | 'failed';
  imageError?: string | null;
  onRetryImages: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-white/10 bg-black/18 ${expanded ? 'xl:col-span-2' : ''}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[0.035]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 text-sm font-semibold text-emerald-300">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{section.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {[section.status, section.estimated_time].filter(Boolean).join(' - ') || 'Details returned by blueprint generation'}
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded ? (
        <div className="grid gap-5 border-t border-white/10 p-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(520px,0.9fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-[#07100d] p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold text-white">Blueprint Diagram</p>
              <span className="text-xs text-slate-500">Layer detail</span>
            </div>
            <ImageStagePanel
              imageUrl={section.diagram_url}
              imageStatus={imageStatus}
              imageError={imageError}
              label={`${section.title} diagram`}
              minHeight="min-h-[340px]"
              onRetry={onRetryImages}
            />
          </div>

          <div className="space-y-4">
            <DetailBlock title="Overview" text={section.overview ?? 'No overview returned for this section.'} />
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Clock3 className="h-4 w-4" />} label="Time" value={section.estimated_time ?? 'Not provided'} />
              <InfoTile icon={<Package className="h-4 w-4" />} label="Blocks" value={typeof section.blocks === 'number' ? section.blocks.toLocaleString() : 'Not provided'} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Layer-by-layer Instructions</p>
              {section.layers?.length ? (
                <div className="space-y-3">
                  {section.layers.map((layer, layerIndex) => (
                    <div key={`${layer.title}-${layerIndex}`} className="rounded-xl bg-black/18 p-3">
                      <p className="text-sm font-semibold text-slate-100">{layer.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{layer.overview ?? 'No layer overview returned.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No layer instructions returned.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-black/16 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-slate-500">{icon}</div>
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getProgressLabel(sections: BlueprintSection[]) {
  if (!sections.length) return 'No progress data';

  const completed = sections.filter((section) => section.status?.toLowerCase().includes('complete')).length;
  return `${completed} of ${sections.length} complete`;
}

function getProgressWidth(sections: BlueprintSection[]) {
  if (!sections.length) return '0%';

  const completed = sections.filter((section) => section.status?.toLowerCase().includes('complete')).length;
  return `${Math.round((completed / sections.length) * 100)}%`;
}
