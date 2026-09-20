export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Top title skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 rounded-xl bg-zinc-800/80" />
        <div className="h-3.5 w-64 rounded-lg bg-zinc-900" />
      </div>

      {/* Action / Search skeleton */}
      <div className="h-11 w-full rounded-2xl bg-zinc-900/80 border border-white/5" />

      {/* Card skeletons */}
      <div className="flex flex-col gap-3">
        <div className="h-28 w-full rounded-3xl bg-zinc-900/60 border border-white/5" />
        <div className="h-28 w-full rounded-3xl bg-zinc-900/60 border border-white/5" />
        <div className="h-28 w-full rounded-3xl bg-zinc-900/60 border border-white/5" />
      </div>
    </div>
  );
}
