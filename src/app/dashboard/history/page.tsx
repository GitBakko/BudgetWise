import { TransactionsTable } from "@/components/history/TransactionsTable";
import { TransactionsSummary } from "@/components/history/TransactionsSummary";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsBarChart } from "@/components/dashboard/charts/TransactionsBarChart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [isChartOpen, setIsChartOpen] = useState(false);

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

      <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <TransactionsSummary timeframe="year" />
        </Suspense>
        
        <div className="flex justify-center mt-4">
            <CollapsibleTrigger asChild>
                <Button variant="ghost">
                    {isChartOpen ? 'Nascondi Grafico' : 'Mostra Grafico Annuale'}
                    <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isChartOpen && "rotate-180")} />
                </Button>
            </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-2 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TransactionsBarChart timeframe="year" />
            </Suspense>
        </CollapsibleContent>
      </Collapsible>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}
