
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";

interface TransactionsSummaryProps {
  timeframe: 'month' | 'year';
}

function ChangeIndicator({ change, type }: { change: number | null, type: 'income' | 'expense' }) {
    if (change === null || !isFinite(change)) {
        return null;
    }

    const isPositive = change > 0;
    const period = type === 'income' ? 'mese' : 'anno';

    return (
        <div className="flex items-center gap-1">
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            <span>{Math.abs(change).toFixed(0)}% vs {period} precedente</span>
        </div>
    );
}


export function TransactionsSummary({ timeframe }: TransactionsSummaryProps) {
  const { loading, summary } = useTransactionsSummary(timeframe);

  if (loading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const periodLabel = timeframe === 'month' ? "Questo mese" : "Ultimo anno";

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
                <div className="text-xs text-success-foreground/80 flex items-center justify-between">
                  <span>{periodLabel}</span>
                  <ChangeIndicator change={summary.incomeChange} type="income" />
                </div>
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
                 <div className="text-xs text-destructive-foreground/80 flex items-center justify-between">
                  <span>{periodLabel}</span>
                  <ChangeIndicator change={summary.expenseChange} type="expense" />
                </div>
            </div>
        </div>
    </div>
  );
}
