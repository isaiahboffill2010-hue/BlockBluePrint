import Image from 'next/image';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex h-11 w-11 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10 shadow-[0_24px_100px_-80px_rgba(34,197,94,0.85)] ${className}`}>
      <Image src="/Block.png" alt="BlockBlueprint logo" fill className="rounded-3xl object-contain" />
    </div>
  );
}
