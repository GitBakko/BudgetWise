"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, BalanceSnapshot, Account } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subDays, startOfDay, format, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
            color: "hsl(var(--chart-1))",
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
                const priorSnapshots = accountSnapshots
                    .filter(s => !isAfter(s.date.toDate(), date))
                    .sort((a, b) => b.date.seconds - a.date.seconds);

                let startingBalance = account.initialBalance;
                let startingDate = account.createdAt.toDate();

                if (priorSnapshots.length > 0) {
                    startingBalance = priorSnapshots[0].balance;
                    startingDate = priorSnapshots[0].date.toDate();
                }

                const balanceChange = accountTransactions
                    .filter(t => isAfter(t.date.toDate(), startingDate) && !isAfter(t.date.toDate(), date))
                    .reduce((acc, t) => {
                        return t.type === 'income' ? acc + t.amount : acc - t.amount;
                    }, 0);
                
                return startingBalance + balanceChange;
            };

            const data = [];
            const today = startOfDay(new Date());
            for (let i = 29; i >= 0; i--) {
                const date = subDays(today, i);
                const balance = calculateBalanceOnDate(date);
                data.push({
                    date: format(date, "d MMM", { locale: it }),
                    [account.name]: parseFloat(balance.toFixed(2)),
                });
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

    return (
        <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Andamento Saldo - {account.name}</CardTitle>
                <CardDescription className="text-xs">Ultimi 30 giorni</CardDescription>
            </CardHeader>
            <CardContent className="h-48 w-full p-0 pr-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`fill-${account.id.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
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
                            stroke="hsl(var(--chart-1))"
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
