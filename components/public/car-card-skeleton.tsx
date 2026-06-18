import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching CarCard's footprint (prevents CLS). */
export function CarCardSkeleton() {
  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

/** A grid of skeletons used as the Suspense fallback for the catalog. */
export function CarGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}
