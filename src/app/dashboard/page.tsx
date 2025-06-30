import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AddTransactionDialog } from "@/components/dashboard/AddTransactionDialog";
import { SavingsAdvisor } from "@/components/dashboard/SavingsAdvisor";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BalanceChart } from "@/components/dashboard/charts/BalanceChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Ecco un riepilogo della tua attività finanziaria.
          </p>
        </div>
        <AddTransactionDialog />
      </div>
      <Suspense fallback={<SummarySkeleton />}>
        <SummaryCards />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <BalanceChart />
      </Suspense>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<TransactionsSkeleton />}>
            <RecentTransactions />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<AdvisorSkeleton />}>
            <SavingsAdvisor />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function AdvisorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
