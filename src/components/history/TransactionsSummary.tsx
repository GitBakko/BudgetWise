"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TransactionsSummaryProps {
  timeframe: 'month' | 'year';
}

const chartConfig = {
    Entrate: {
        label: "Entrate",
        color: "hsl(var(--chart-2))",
    },
    Spese: {
        label: "Spese",
        color: "hsl(var(--chart-3))",
    }
} satisfies ChartConfig;


export function TransactionsSummary({ timeframe }: TransactionsSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { loading, summary, chartData } = useTransactionsSummary(timeframe);
  const title = timeframe === 'month' ? 'Riepilogo Mensile' : 'Riepilogo Annuale';

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totale Entrate</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-success">
                        +€{summary.totalIncome.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {timeframe === 'month' ? "Questo mese" : "Ultimo anno"}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totale Spese</CardTitle>
                    <ArrowDownLeft className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        -€{summary.totalExpense.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                     <p className="text-xs text-muted-foreground">
                        {timeframe === 'month' ? "Questo mese" : "Ultimo anno"}
                    </p>
                </CardContent>
            </Card>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex justify-center">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost">
                        {isOpen ? 'Nascondi Grafico' : 'Mostra Grafico'}
                        <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="mt-2 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <Card>
                    <CardHeader>
                        <CardTitle>{title} Transazioni</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 w-full p-0 pr-2">
                    {chartData.length > 1 ? (
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                                <YAxis tickFormatter={(tick) => `€${tick.toLocaleString('it-IT')}`} tickLine={false} axisLine={false} tickMargin={5} fontSize={12} width={70}/>
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={<ChartTooltipContent 
                                        indicator="dot"
                                        formatter={(value, name) => (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color}}/>
                                                <div className="flex justify-between w-full">
                                                    <span>{name}</span>
                                                    <span className="font-bold ml-4">€{typeof value === 'number' ? value.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}</span>
                                                </div>
                                            </div>
                                        )}
                                    />}
                                />
                                <Legend />
                                <Bar dataKey="Entrate" fill="var(--color-Entrate)" radius={4} />
                                <Bar dataKey="Spese" fill="var(--color-Spese)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Dati insufficienti per il grafico.</p>
                        </div>
                    )}
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
