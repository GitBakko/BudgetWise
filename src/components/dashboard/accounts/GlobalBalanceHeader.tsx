"use client";

import { useSummary } from "@/hooks/useSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, ChevronDown } from "lucide-react";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalBalanceHeaderProps {
  isChartOpen: boolean;
}

export function GlobalBalanceHeader({ isChartOpen }: GlobalBalanceHeaderProps) {
  const { summary, loading } = useSummary();

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="flex items-center justify-between bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-4">
        <PiggyBank className="h-8 w-8 flex-shrink-0" />
        <div>
            <h2 className="text-sm font-medium text-primary-foreground/80">Saldo Totale Complessivo</h2>
            <p className="text-3xl font-bold">
              €{summary.totalBalance.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
        </div>
      </div>
      <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground rounded-full">
              <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isChartOpen && "rotate-180")} />
              <span className="sr-only">Mostra/nascondi andamento</span>
          </Button>
      </CollapsibleTrigger>
    </div>
  );
}
