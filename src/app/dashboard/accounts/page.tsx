import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { AddAccountDialog } from "@/components/dashboard/accounts/AddAccountDialog";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I Tuoi Conti</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi conti correnti e di risparmio.
          </p>
        </div>
        <AddAccountDialog />
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AccountsList />
      </Suspense>
    </div>
  );
}
