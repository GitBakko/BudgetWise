
"use client";

import { useSummary } from "@/hooks/useSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank } from "lucide-react";

export function TotalBalanceCard() {
  const { summary, loading } = useSummary();

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-4">
        <PiggyBank className="h-8 w-8 flex-shrink-0" />
        <div>
            <h2 className="text-sm font-medium text-primary-foreground/80">Saldo Totale Complessivo</h2>
            <p className="text-3xl font-bold">
              €{summary.totalBalance.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
        </div>
      </div>
    </div>
  );
}
