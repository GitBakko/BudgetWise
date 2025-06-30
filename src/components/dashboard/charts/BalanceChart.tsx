
"use client"

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subDays, startOfDay, format } from "date-fns";
import { it } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

export function BalanceChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
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
      
      const calculateTotalBalanceOnDate = (date: Date) => {
        let totalBalance = 0;

        for (const account of allAccounts) {
            const accountTransactions = allTransactions
                .filter(t => t.accountId === account.id && t.date.toDate() <= date);
            
            const accountSnapshots = allSnapshots
                .filter(s => s.accountId === account.id && s.date.toDate() <= date)
                .sort((a, b) => b.date.seconds - a.date.seconds);

            let startingBalance = account.initialBalance;
            let startingDate = account.createdAt.toDate();

            if (accountSnapshots.length > 0) {
                startingBalance = accountSnapshots[0].balance;
                startingDate = accountSnapshots[0].date.toDate();
            }

            const balanceChange = accountTransactions
                .filter(t => t.date.toDate() > startingDate)
                .reduce((acc, t) => {
                    return t.type === 'income' ? acc + t.amount : acc - t.amount;
                }, 0);
            
            totalBalance += startingBalance + balanceChange;
        }
        return totalBalance;
      };

      const data = [];
      const today = startOfDay(new Date());
      for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i);
        const dayBalance = calculateTotalBalanceOnDate(date);
        data.push({
          name: format(date, "d MMM", {locale: it}),
          Saldo: dayBalance,
        });
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

  if (loading) {
    return <Skeleton className="w-full h-80" />;
  }
  
  const formatYAxis = (tick: number) => `€${tick}`;
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-sm bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`Saldo: €${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle>Andamento Saldo Totale</CardTitle>
        </div>
        <CardDescription>
          Variazione del saldo totale negli ultimi 30 giorni.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80 w-full pr-6">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis tickFormatter={formatYAxis} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--accent))', fillOpacity: 0.1}} />
                <Area type="monotone" dataKey="Saldo" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
