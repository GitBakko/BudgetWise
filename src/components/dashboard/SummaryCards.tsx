"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Timestamp } from "firebase/firestore";

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

    let unsubTransactions: () => void;
    let unsubAccounts: () => void;

    let allTransactions: Transaction[] = [];
    let allAccounts: Account[] = [];
    let isDataLoaded = { transactions: false, accounts: false };

    const calculateSummary = () => {
      if (!user || !isDataLoaded.transactions || !isDataLoaded.accounts) return;

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

      let totalIncome = 0;
      let totalExpense = 0;
      allTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
      });
      
      const initialBalance = allAccounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
      const totalBalance = initialBalance + totalIncome - totalExpense;

      setSummary({ monthlyIncome, monthlyExpense, totalBalance });
      setLoading(false);
    };

    const transQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    unsubTransactions = onSnapshot(transQuery, (snapshot) => {
      allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      isDataLoaded.transactions = true;
      calculateSummary();
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    });
    
    const accQuery = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    unsubAccounts = onSnapshot(accQuery, (snapshot) => {
      allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      isDataLoaded.accounts = true;
      calculateSummary();
    }, (error) => {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    });

    return () => {
      if (unsubTransactions) unsubTransactions();
      if (unsubAccounts) unsubAccounts();
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
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +${summary.monthlyIncome.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spese Mensili</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -${summary.monthlyExpense.toFixed(2)}
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
            ${summary.totalBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldo complessivo di tutti i conti
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
