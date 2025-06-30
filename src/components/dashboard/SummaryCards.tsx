"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
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
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const today = new Date();
        const startDate = startOfMonth(today);
        const endDate = endOfMonth(today);

        let income = 0;
        let expense = 0;

        querySnapshot.forEach((doc) => {
          const transaction = doc.data() as Omit<Transaction, 'id' | 'date'> & { date: Timestamp };
          const transactionDate = transaction.date.toDate();

          if (transactionDate >= startDate && transactionDate <= endDate) {
            if (transaction.type === "income") {
              income += transaction.amount;
            } else {
              expense += transaction.amount;
            }
          }
        });

        setSummary({ income, expense, balance: income - expense });
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching summary:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
          <CardTitle className="text-sm font-medium">Entrate Totali</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +${summary.income.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spese Totali</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -${summary.expense.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Questo mese</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.balance >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            ${summary.balance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Saldo mensile attuale
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
