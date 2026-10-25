export default function Loading() {
  return (
    <div className="flex-1 bg-night">
      <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8">
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="mt-6 h-9 w-2/3 rounded-lg bg-white/8" />
        <div className="mt-3 h-4 w-1/2 rounded bg-white/8" />
        <div className="mt-8 h-[260px] rounded-xl bg-white/8 sm:h-[440px]" />
      </div>
    </div>
  );
}
