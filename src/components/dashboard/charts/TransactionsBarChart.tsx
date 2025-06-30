
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsBarChartProps {
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

export function TransactionsBarChart({ timeframe }: TransactionsBarChartProps) {
  const { loading, chartData } = useTransactionsSummary(timeframe);
  const title = timeframe === 'month' ? 'Riepilogo Mensile' : 'Riepilogo Annuale';
  const description = timeframe === 'month' ? 'Entrate e spese giorno per giorno' : 'Entrate e spese mese per mese';
  
  if(loading) {
      return <Skeleton className="w-full h-96" />
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 w-full p-0 pr-2">
        {chartData.length > 0 ? (
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
  )
}
