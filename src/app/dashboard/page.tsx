import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SavingsAdvisor } from "@/components/dashboard/SavingsAdvisor";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsSummary } from "@/components/history/TransactionsSummary";
import { TotalBalanceCard } from "@/components/dashboard/TotalBalanceCard";
import { BalanceChart } from "@/components/dashboard/charts/BalanceChart";
import { TransactionsBarChart } from "@/components/dashboard/charts/TransactionsBarChart";

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
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <TotalBalanceCard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <TransactionsSummary timeframe="month" />
      </Suspense>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <BalanceChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TransactionsBarChart timeframe="month" />
        </Suspense>
      </div>

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
