"use client";

import { AccountsList } from "@/components/dashboard/accounts/AccountsList";
import { AddAccountDialog } from "@/components/dashboard/accounts/AddAccountDialog";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { GlobalBalanceHeader } from "@/components/dashboard/accounts/GlobalBalanceHeader";
import { BalanceChart } from "@/components/dashboard/charts/BalanceChart";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";


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
  const [isGlobalChartOpen, setIsGlobalChartOpen] = useState(false);

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
      
      <Collapsible open={isGlobalChartOpen} onOpenChange={setIsGlobalChartOpen} className="w-full space-y-4">
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <GlobalBalanceHeader isChartOpen={isGlobalChartOpen} />
        </Suspense>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                <BalanceChart />
            </Suspense>
        </CollapsibleContent>
      </Collapsible>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AccountsList />
      </Suspense>
    </div>
  );
}
