"use client";

import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { AddAccountDialog } from "@/components/dashboard/accounts/AddAccountDialog";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { TotalBalanceCard } from "@/components/dashboard/accounts/TotalBalanceCard";
import { BalanceChart } from "@/components/dashboard/charts/BalanceChart";

const ImportBalancesDialog = dynamic(
  () =>
    import("@/components/dashboard/accounts/ImportBalancesDialog").then(
      (mod) => mod.ImportBalancesDialog
    ),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled>
        <Upload className="mr-2 h-4 w-4" />
        Importa Saldi
      </Button>
    ),
  }
);

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I Tuoi Conti</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi conti, visualizza l'andamento e importa i dati.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportBalancesDialog />
          <AddAccountDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <TotalBalanceCard />
            </Suspense>
        </div>
        <div className="lg:col-span-2">
             <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                <BalanceChart />
             </Suspense>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AccountsList />
      </Suspense>
    </div>
  );
}
