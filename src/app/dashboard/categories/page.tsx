
import { CategoriesList } from "@/components/dashboard/categories/CategoriesList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCategoryDialog } from "@/components/dashboard/categories/AddCategoryDialog";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Categorie</h1>
          <p className="text-muted-foreground">
            Crea, modifica ed elimina le tue categorie di spesa e entrata.
          </p>
        </div>
        <AddCategoryDialog />
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CategoriesList />
      </Suspense>
    </div>
  );
}
