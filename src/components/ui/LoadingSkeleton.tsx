export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
          key={index}
        />
      ))}
    </div>
  );
}
