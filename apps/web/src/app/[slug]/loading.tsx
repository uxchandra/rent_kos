export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-4 py-8">
      <div className="h-4 w-32 rounded bg-subtle" />
      <div className="mt-6 h-9 w-2/3 rounded-lg bg-subtle" />
      <div className="mt-3 h-4 w-1/2 rounded bg-subtle" />
      <div className="mt-8 h-[260px] rounded-xl bg-subtle sm:h-[440px]" />
    </div>
  );
}
