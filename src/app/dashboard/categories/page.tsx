
import { CategoriesList } from "@/components/dashboard/categories/CategoriesList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CategoriesList />
    </Suspense>
  );
}
