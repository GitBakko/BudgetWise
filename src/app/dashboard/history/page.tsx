import { TransactionsTable } from "@/components/history/TransactionsTable";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transaction History
        </h1>
        <p className="text-muted-foreground">
          View and manage all your past transactions.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}
