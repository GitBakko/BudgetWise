"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";

export function SummaryCards() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    totalBalance: 0,
  });
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

      const today = new Date();
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);

      let monthlyIncome = 0;
      let monthlyExpense = 0;
      allTransactions.forEach((transaction) => {
        const transactionDate = transaction.date.toDate();
        if (transactionDate >= startDate && transactionDate <= endDate) {
          if (transaction.type === "income") {
            monthlyIncome += transaction.amount;
          } else {
            monthlyExpense += transaction.amount;
          }
        }
      });
      
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

      const totalBalance = allAccounts.reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0);

      setSummary({ monthlyIncome, monthlyExpense, totalBalance });
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
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrate Mensili</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            +€{summary.monthlyIncome.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spese Mensili</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            -€{summary.monthlyExpense.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Totale</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.totalBalance >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            €{summary.totalBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldo complessivo di tutti i conti
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
