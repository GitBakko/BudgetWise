"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, BalanceSnapshot, Account } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfDay, format, isAfter, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChartTimeSettings, calculateBalanceOnDate } from "@/lib/balanceCalculations";

interface AccountTrendChartProps {
    account: Account;
}

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
        const dataLoaded = { transactions: false, snapshots: false };

        const generateData = () => {
            if (!user || !dataLoaded.transactions || !dataLoaded.snapshots) return;

            const today = startOfDay(new Date());
            
            let oldestDate = startOfDay((account.balanceStartDate || account.createdAt).toDate());
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
                // We pass all transactions and snapshots and let the function filter internally
                // This is a slight simplification from passing pre-filtered arrays, assuming the performance is acceptable.
                // For a large dataset, pre-filtering would be better.
                const balance = calculateBalanceOnDate(account, currentDate, accountTransactions, accountSnapshots);
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
            generateData();
        }));

        const snapQuery = query(collection(db, "balanceSnapshots"), where("userId", "==", user.uid), where("accountId", "==", account.id));
        unsubscribers.push(onSnapshot(snapQuery, (snapshot) => {
            accountSnapshots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceSnapshot));
            dataLoaded.snapshots = true;
            generateData();
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
