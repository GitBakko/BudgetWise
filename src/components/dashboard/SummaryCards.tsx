"use client";

import { useSummary } from "@/hooks/useSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";

export function SummaryCards() {
  const { summary, loading } = useSummary();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrate Mensili</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            +€{summary.monthlyIncome.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spese Mensili</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            -€{summary.monthlyExpense.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Totale</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.totalBalance >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            €{summary.totalBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldo complessivo di tutti i conti
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
