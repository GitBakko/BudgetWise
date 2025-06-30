"use client"

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isBefore } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Layers } from "lucide-react";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { generateGlobalChartData, precomputeChartConfigAndGrouping } from "@/lib/balanceCalculations";


export function BalanceChart() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allSnapshots, setAllSnapshots] = useState<BalanceSnapshot[]>([]);

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    if (dataKey) {
        setHiddenSeries(prev => 
            prev.includes(dataKey) 
                ? prev.filter(key => key !== dataKey) 
                : [...prev, dataKey]
        );
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];
    
    let isInitialLoad = true;

    const transQuery = query(collection(db, "transactions"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(transQuery, (snapshot) => {
      setAllTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }));
    
    const accQuery = query(collection(db, "accounts"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(accQuery, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      accountsData.sort((a, b) => a.name.localeCompare(b.name));
      setAllAccounts(accountsData);
      if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
      }
    }));

    const snapQuery = query(collection(db, "balanceSnapshots"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(snapQuery, (snapshot) => {
      setAllSnapshots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceSnapshot)));
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  const groupingInfo = useMemo(() => {
    return precomputeChartConfigAndGrouping(allAccounts, allTransactions, allSnapshots);
  }, [allAccounts, allTransactions, allSnapshots]);

  const { isGroupingActive, baseConfig } = groupingInfo;

  const visibleSeries = Object.keys(baseConfig).filter(key => !hiddenSeries.includes(key));
  const shouldExplode = isGroupingActive && visibleSeries.length === 1 && visibleSeries[0] === 'Altri';

  const handleResetView = () => {
    setHiddenSeries([]);
  };
  
  const { chartData, chartConfig } = useMemo(() => {
    return generateGlobalChartData(allAccounts, allTransactions, allSnapshots, groupingInfo, shouldExplode);
  }, [allAccounts, allTransactions, allSnapshots, groupingInfo, shouldExplode]);


  if (loading) {
    return <Skeleton className="w-full h-80" />;
  }

  if (chartData.length <= 1) {
      return (
          <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      <CardTitle>Andamento Saldi</CardTitle>
                  </div>
                  <CardDescription>
                      Variazione dei saldi nel tempo.
                  </CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Dati insufficienti per visualizzare il grafico.</p>
              </CardContent>
          </Card>
      );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <CardTitle>Andamento Saldi</CardTitle>
            </div>
            {shouldExplode && (
                <Button variant="outline" size="sm" onClick={handleResetView} className="animate-in fade-in">
                    <Layers className="mr-2 h-4 w-4" />
                    Vista Aggregata
                </Button>
            )}
        </div>
        <CardDescription>
            {shouldExplode 
              ? "Dettaglio dei conti raggruppati in 'Altri'. Clicca sulla legenda per filtrare."
              : "Variazione dei saldi nel tempo. Clicca sulla legenda per mostrare/nascondere le linee."
            }
        </CardDescription>
      </CardHeader>
      <CardContent className="h-96 w-full p-0 pr-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                 {Object.keys(chartConfig).map((key) => (
                    <defs key={`def-${key}`}>
                        <linearGradient id={`fill-balance-chart-${key.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig[key]?.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={chartConfig[key]?.color} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                 ))}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis tickFormatter={(tick) => `€${tick.toLocaleString('it-IT')}`} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} width={80} />
                <Tooltip
                    content={<ChartTooltipContent 
                      indicator="line"
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: chartConfig[name as string]?.color}}/>
                           <div className="flex justify-between w-full">
                            <span>{name}</span>
                            <span className="font-bold ml-4">€{typeof value === 'number' ? value.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}</span>
                           </div>
                        </div>
                      )}
                    />}
                />
                <Legend 
                    verticalAlign="top" 
                    wrapperStyle={{paddingBottom: '20px', cursor: 'pointer'}}
                    onClick={handleLegendClick}
                />
                {Object.keys(chartConfig).map((key) => {
                    const isTotal = key === "Saldo Totale";
                    const isOthers = key === "Altri";
                    return (
                        <Area
                            key={key}
                            dataKey={key}
                            type="monotone"
                            stroke={chartConfig[key]?.color}
                            fill={`url(#fill-balance-chart-${key.replace(/[^a-zA-Z0-9]/g, '')})`}
                            strokeWidth={isTotal ? 2.5 : 1.5}
                            strokeDasharray={isOthers ? "3 3" : (isTotal ? "0" : "5 5")}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 1, fill: "hsl(var(--background))" }}
                            hide={hiddenSeries.includes(key)}
                        />
                    )
                })}
            </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
