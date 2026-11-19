export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="skeleton h-3 w-32" />
      <div className="skeleton mt-4 h-9 w-full max-w-lg" />
      <div className="skeleton mt-3 h-3 w-full max-w-xl" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel p-4">
            <div className="skeleton h-2.5 w-24" />
            <div className="skeleton mt-3 h-6 w-14" />
            <div className="skeleton mt-3 h-2.5 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton h-14 w-full" />
          ))}
        </div>
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading network information…</span>
    </div>
  );
}
