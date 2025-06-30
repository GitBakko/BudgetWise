
"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  startOfDay, 
  format,
  differenceInDays, 
  subDays,
  addDays, 
  startOfMonth, 
  addMonths, 
  startOfQuarter, 
  addQuarters, 
  startOfYear, 
  addYears,
  isAfter,
  isBefore
} from "date-fns";
import { it } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const GROUPING_THRESHOLD = 0.02; // 2%
const MIN_ACCOUNTS_FOR_GROUPING = 3; // Apply grouping only if there are 3 or more accounts


const getChartTimeSettings = (oldestDate: Date, newestDate: Date) => {
    const daysDiff = differenceInDays(newestDate, oldestDate);

    if (daysDiff <= 60) { // Up to 2 months -> daily
        return {
            startDate: subDays(newestDate, Math.max(daysDiff, 29)), // Show at least 30 days
            increment: (d: Date) => addDays(d, 1),
            format: "d MMM"
        };
    } else if (daysDiff <= 365 * 1.5) { // Up to 1.5 years -> monthly
        return {
            startDate: startOfMonth(oldestDate),
            increment: (d: Date) => addMonths(d, 1),
            format: "MMM yy"
        };
    } else if (daysDiff <= 365 * 3) { // Up to 3 years -> quarterly
        return {
            startDate: startOfQuarter(oldestDate),
            increment: (d: Date) => addQuarters(d, 1),
            format: (d: Date) => `Q${Math.floor((d.getMonth() + 3) / 3)} ${format(d, 'yy')}`
        };
    } else { // More than 3 years -> yearly
        return {
            startDate: startOfYear(oldestDate),
            increment: (d: Date) => addYears(d, 1),
            format: "yyyy"
        };
    }
};

export function BalanceChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];
    
    let allTransactions: Transaction[] = [];
    let allAccounts: Account[] = [];
    let allSnapshots: BalanceSnapshot[] = [];

    let dataLoaded = { transactions: false, accounts: false, snapshots: false };

    const calculateData = () => {
      if (!user || !dataLoaded.transactions || !dataLoaded.accounts || !dataLoaded.snapshots) return;
      
      if (allAccounts.length === 0) {
          setLoading(false);
          setChartData([]);
          setChartConfig({});
          return;
      }
      
      const calculateAccountBalanceOnDate = (account: Account, date: Date, transactions: Transaction[], snapshots: BalanceSnapshot[]) => {
          const accountTransactions = transactions.filter(t => t.accountId === account.id);
          
          const accountSnapshots = snapshots
              .filter(s => s.accountId === account.id && !isAfter(s.date.toDate(), date))
              .sort((a, b) => b.date.seconds - a.date.seconds);

          let startingBalance = account.initialBalance;
          let startingDate = account.createdAt.toDate();

          if (accountSnapshots.length > 0) {
              startingBalance = accountSnapshots[0].balance;
              startingDate = accountSnapshots[0].date.toDate();
          }

          const balanceChange = accountTransactions
              .filter(t => isAfter(t.date.toDate(), startingDate) && !isAfter(t.date.toDate(), date))
              .reduce((acc, t) => {
                  return t.type === 'income' ? acc + t.amount : acc - t.amount;
              }, 0);
          
          return startingBalance + balanceChange;
      };

      const today = startOfDay(new Date());

      // Determine grouping
      const finalBalances = new Map<string, number>();
      allAccounts.forEach(acc => {
          const balance = calculateAccountBalanceOnDate(acc, today, allTransactions, allSnapshots);
          finalBalances.set(acc.id, balance);
      });
      const totalFinalBalance = Math.abs(Array.from(finalBalances.values()).reduce((sum, b) => sum + b, 0));
      
      let majorAccounts: Account[] = [...allAccounts];
      let minorAccounts: Account[] = [];
      let isGroupingActive = false;

      if (allAccounts.length >= MIN_ACCOUNTS_FOR_GROUPING && totalFinalBalance > 0) {
          const thresholdAmount = totalFinalBalance * GROUPING_THRESHOLD;
          const tempMajor: Account[] = [];
          const tempMinor: Account[] = [];

          allAccounts.forEach(acc => {
              if (Math.abs(finalBalances.get(acc.id) ?? 0) < thresholdAmount) {
                  tempMinor.push(acc);
              } else {
                  tempMajor.push(acc);
              }
          });
          
          if (tempMinor.length > 0) {
              isGroupingActive = true;
              majorAccounts = tempMajor;
              minorAccounts = tempMinor;
          }
      }

      // Setup Chart Config
      const accountColors = [
          "hsl(var(--chart-1))",
          "hsl(var(--chart-2))",
          "hsl(var(--chart-3))",
          "hsl(var(--chart-4))",
          "hsl(var(--chart-5))",
      ];
      const config: ChartConfig = {
        "Saldo Totale": {
          label: "Saldo Totale",
          color: "hsl(var(--primary))",
        },
      };

      majorAccounts.forEach((account, index) => {
        config[account.name] = {
          label: account.name,
          color: account.color || accountColors[index % accountColors.length],
        };
      });

      if (isGroupingActive) {
          config["Altri"] = {
              label: "Altri",
              color: "hsl(var(--muted-foreground))",
          }
      }
      setChartConfig(config);


      // Find the absolute oldest date from all data points
      let oldestDate = new Date();
      allAccounts.forEach(acc => {
        if (isBefore(acc.createdAt.toDate(), oldestDate)) oldestDate = acc.createdAt.toDate();
      });
      allSnapshots.forEach(snap => {
        if (isBefore(snap.date.toDate(), oldestDate)) oldestDate = snap.date.toDate();
      });
      
      const settings = getChartTimeSettings(startOfDay(oldestDate), today);

      const data = [];
      let currentDate = settings.startDate;
      
      while (!isAfter(currentDate, today)) {
        const dayData: { [key: string]: any } = {
          date: typeof settings.format === 'function' ? settings.format(currentDate) : format(currentDate, settings.format, { locale: it }),
        };

        let totalDayBalance = 0;
        
        majorAccounts.forEach(acc => {
            const balance = calculateAccountBalanceOnDate(acc, currentDate, allTransactions, allSnapshots);
            dayData[acc.name] = parseFloat(balance.toFixed(2));
            totalDayBalance += balance;
        });

        if (isGroupingActive) {
            let othersBalance = 0;
            minorAccounts.forEach(acc => {
                const balance = calculateAccountBalanceOnDate(acc, currentDate, allTransactions, allSnapshots);
                othersBalance += balance;
            });
            dayData["Altri"] = parseFloat(othersBalance.toFixed(2));
            totalDayBalance += othersBalance;
        }

        dayData["Saldo Totale"] = parseFloat(totalDayBalance.toFixed(2));
        
        data.push(dayData);
        currentDate = settings.increment(currentDate);
      }
      
      setChartData(data);
      setLoading(false);
    };

    const transQuery = query(collection(db, "transactions"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(transQuery, (snapshot) => {
      allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      dataLoaded.transactions = true;
      calculateData();
    }));
    
    const accQuery = query(collection(db, "accounts"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(accQuery, (snapshot) => {
      allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      dataLoaded.accounts = true;
      calculateData();
    }));

    const snapQuery = query(collection(db, "balanceSnapshots"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(snapQuery, (snapshot) => {
      allSnapshots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceSnapshot));
      dataLoaded.snapshots = true;
      calculateData();
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  if (loading || !chartConfig) {
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
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle>Andamento Saldi</CardTitle>
        </div>
        <CardDescription>
          Variazione dei saldi nel tempo. Clicca sulla legenda per mostrare/nascondere le linee.
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
                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
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
                        />
                    )
                })}
            </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
