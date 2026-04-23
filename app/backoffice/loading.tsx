import { Skeleton } from "@/components/admin/AdminPrimitives";

export default function BackofficeLoading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-live="polite">
      <div className="pb-6 border-b border-ink/15">
        <Skeleton className="h-3 w-48 mb-3" />
        <Skeleton className="h-12 w-[min(520px,70%)] mb-3" />
        <Skeleton className="h-4 w-[min(420px,60%)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-paper-soft border border-ink/10 rounded-[2px] p-5 flex flex-col gap-3"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-16 mt-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        {Array.from({ length: 2 }).map((_, c) => (
          <div
            key={c}
            className="bg-paper-soft border border-ink/10 rounded-[2px] p-6 flex flex-col gap-4"
          >
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_1fr_auto] gap-4 items-center py-2 border-t border-ink/8"
              >
                <Skeleton className="h-10 w-10" rounded="50%" />
                <div className="flex flex-col gap-2 min-w-0">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-5 w-20" rounded="999px" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4 text-[11px] tracking-eyebrow uppercase font-bold text-ink-subtle justify-center">
        <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
        Chargement du backoffice…
      </div>
    </div>
  );
}
