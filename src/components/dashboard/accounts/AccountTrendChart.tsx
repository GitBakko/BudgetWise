"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, BalanceSnapshot, Account } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  startOfDay, 
  format, 
  isAfter,
  isBefore,
  differenceInDays,
  subDays,
  addDays,
  startOfMonth,
  addMonths,
  startOfQuarter,
  addQuarters,
  startOfYear,
  addYears
} from "date-fns";
import { it } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountTrendChartProps {
    account: Account;
}

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
            format: (d: Date) => `Q${Math.floor((d.getMonth() + 3) / 3)} '${format(d, 'yy')}`
        };
    } else { // More than 3 years -> yearly
        return {
            startDate: startOfYear(oldestDate),
            increment: (d: Date) => addYears(d, 1),
            format: "yyyy"
        };
    }
};

export function AccountTrendChart({ account }: AccountTrendChartProps) {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const chartConfig = {
        [account.name]: {
            label: account.name,
            color: account.color || "hsl(var(--chart-1))",
        },
    } satisfies ChartConfig;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribers: (() => void)[] = [];
        
        let accountTransactions: Transaction[] = [];
        let accountSnapshots: BalanceSnapshot[] = [];
        let dataLoaded = { transactions: false, snapshots: false };

        const calculateData = () => {
            if (!user || !dataLoaded.transactions || !dataLoaded.snapshots) return;

            const calculateBalanceOnDate = (date: Date) => {
                if (isBefore(date, account.balanceStartDate.toDate())) {
                    return 0;
                }

                const priorSnapshots = accountSnapshots
                    .filter(s => !isAfter(s.date.toDate(), date))
                    .sort((a, b) => b.date.seconds - a.date.seconds);

                let referenceBalance = account.initialBalance;
                let referenceDate = account.balanceStartDate.toDate();

                const latestApplicableSnapshot = priorSnapshots.find(s => !isBefore(s.date.toDate(), referenceDate));

                if (latestApplicableSnapshot) {
                    referenceBalance = latestApplicableSnapshot.balance;
                    referenceDate = latestApplicableSnapshot.date.toDate();
                }
                
                const balanceChange = accountTransactions
                    .filter(t => isAfter(t.date.toDate(), referenceDate) && !isAfter(t.date.toDate(), date))
                    .reduce((acc, t) => {
                        return t.type === 'income' ? acc + t.amount : acc - t.amount;
                    }, 0);
                
                return referenceBalance + balanceChange;
            };
            
            const today = startOfDay(new Date());
            
            let oldestDate = startOfDay(account.balanceStartDate.toDate());
            if (accountSnapshots.length > 0) {
                const oldestSnapshotDate = accountSnapshots.reduce((oldest, s) => {
                    const sDate = s.date.toDate();
                    return isBefore(sDate, oldest) ? sDate : oldest;
                }, new Date());
                
                if (isBefore(oldestSnapshotDate, oldestDate)) {
                    oldestDate = oldestSnapshotDate;
                }
            }
            
            const settings = getChartTimeSettings(oldestDate, today);
            
            const data = [];
            let currentDate = settings.startDate;

            while (!isAfter(currentDate, today)) {
                const balance = calculateBalanceOnDate(currentDate);
                data.push({
                    date: typeof settings.format === 'function' ? settings.format(currentDate) : format(currentDate, settings.format, { locale: it }),
                    [account.name]: parseFloat(balance.toFixed(2)),
                });
                currentDate = settings.increment(currentDate);
            }
            
            setChartData(data);
            setLoading(false);
        };

        const transQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), where("accountId", "==", account.id));
        unsubscribers.push(onSnapshot(transQuery, (snapshot) => {
            accountTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            dataLoaded.transactions = true;
            calculateData();
        }));

        const snapQuery = query(collection(db, "balanceSnapshots"), where("userId", "==", user.uid), where("accountId", "==", account.id));
        unsubscribers.push(onSnapshot(snapQuery, (snapshot) => {
            accountSnapshots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceSnapshot));
            dataLoaded.snapshots = true;
            calculateData();
        }));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user, account]);

    if (loading) {
        return <div className="h-56 w-full bg-muted animate-pulse rounded-lg" />;
    }

    if (chartData.length <= 1) {
        return (
             <Card className="border-dashed bg-transparent shadow-none">
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Andamento Saldo - {account.name}</CardTitle>
                    <CardDescription className="text-xs">Andamento nel tempo</CardDescription>
                </CardHeader>
                <CardContent className="h-48 w-full p-0 pr-2 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Dati insufficienti per generare il grafico.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Andamento Saldo - {account.name}</CardTitle>
                <CardDescription className="text-xs">Andamento nel tempo</CardDescription>
            </CardHeader>
            <CardContent className="h-48 w-full p-0 pr-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`fill-${account.id.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartConfig[account.name]?.color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={chartConfig[account.name]?.color} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                        <YAxis tickFormatter={(tick) => `€${tick.toLocaleString('it-IT')}`} tickLine={false} axisLine={false} tickMargin={5} fontSize={12} width={70}/>
                        <Tooltip
                            cursor={{stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3"}}
                            content={<ChartTooltipContent 
                                indicator="dot"
                                labelClassName="text-sm"
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
                        <Area
                            dataKey={account.name}
                            type="monotone"
                            stroke={chartConfig[account.name]?.color}
                            fill={`url(#fill-${account.id.replace(/[^a-zA-Z0-9]/g, '')})`}
                            strokeWidth={2}
                            dot={{r: 0}}
                            activeDot={{ r: 4, strokeWidth: 1, fill: "hsl(var(--background))" }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
