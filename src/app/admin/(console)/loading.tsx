export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-64" />
        <div className="skeleton h-3 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel p-4">
            <div className="skeleton h-2.5 w-20" />
            <div className="skeleton mt-3 h-7 w-16" />
            <div className="skeleton mt-3 h-2.5 w-28" />
          </div>
        ))}
      </div>
      <div className="panel p-4">
        <div className="skeleton h-3 w-32" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-8 w-full" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading console data…</span>
    </div>
  );
}
