export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton mt-3 h-4 w-32 rounded-lg" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="skeleton h-96 rounded-2xl" />
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200">
                <div className="skeleton aspect-square" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4 w-4/5 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton mt-3 h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
