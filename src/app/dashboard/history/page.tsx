import { TransactionsTable } from "@/components/history/TransactionsTable";
import { TransactionsSummary } from "@/components/history/TransactionsSummary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cronologia Transazioni
        </h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci tutte le tue transazioni passate.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <TransactionsSummary timeframe="year" />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}
