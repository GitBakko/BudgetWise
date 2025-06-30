"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank } from "lucide-react";

export function TotalBalanceCard() {
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
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

    const calculateSummary = () => {
      if (!user || !dataLoaded.transactions || !dataLoaded.accounts || !dataLoaded.snapshots) return;
      
      const calculateCurrentBalance = (account: Account) => {
        const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
        const accountSnapshots = allSnapshots
            .filter(s => s.accountId === account.id)
            .sort((a, b) => b.date.seconds - a.date.seconds);

        let referenceDate = account.createdAt;
        let referenceBalance = account.initialBalance;

        if (accountSnapshots.length > 0) {
            referenceDate = accountSnapshots[0].date;
            referenceBalance = accountSnapshots[0].balance;
        }

        const balanceChange = accountTransactions
            .filter(t => t.date.seconds > referenceDate.seconds)
            .reduce((acc, t) => {
                return t.type === 'income' ? acc + t.amount : acc - t.amount;
            }, 0);

        return referenceBalance + balanceChange;
      };

      const total = allAccounts.reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0);

      setTotalBalance(total);
      setLoading(false);
    };

    const transQuery = query(collection(db, "transactions"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(transQuery, (snapshot) => {
      allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      dataLoaded.transactions = true;
      calculateSummary();
    }));
    
    const accQuery = query(collection(db, "accounts"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(accQuery, (snapshot) => {
      allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      dataLoaded.accounts = true;
      calculateSummary();
    }));

    const snapQuery = query(collection(db, "balanceSnapshots"), where("userId", "==", user.uid));
    unsubscribers.push(onSnapshot(snapQuery, (snapshot) => {
      allSnapshots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceSnapshot));
      dataLoaded.snapshots = true;
      calculateSummary();
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Totale Complessivo</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              totalBalance >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            €{totalBalance.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldo complessivo di tutti i conti attivi.
          </p>
        </CardContent>
      </Card>
  );
}
