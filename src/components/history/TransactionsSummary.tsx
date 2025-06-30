
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";

interface TransactionsSummaryProps {
  timeframe: 'month' | 'year';
}

export function TransactionsSummary({ timeframe }: TransactionsSummaryProps) {
  const { loading, summary } = useTransactionsSummary(timeframe);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-success text-success-foreground rounded-lg p-6 shadow-lg">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Totale Entrate</div>
                <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
                <div className="text-2xl font-bold">
                    +€{summary.totalIncome.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <p className="text-xs text-success-foreground/80">
                    {timeframe === 'month' ? "Questo mese" : "Ultimo anno"}
                </p>
            </div>
        </div>
         <div className="bg-destructive text-destructive-foreground rounded-lg p-6 shadow-lg">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Totale Spese</div>
                <ArrowDownLeft className="h-4 w-4" />
            </div>
            <div>
                <div className="text-2xl font-bold">
                    -€{summary.totalExpense.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                 <p className="text-xs text-destructive-foreground/80">
                    {timeframe === 'month' ? "Questo mese" : "Ultimo anno"}
                </p>
            </div>
        </div>
    </div>
  );
}
