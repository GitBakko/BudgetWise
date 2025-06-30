"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth } from "date-fns";
import { calculateAllAccountsCurrentBalance } from "@/lib/balanceCalculations";


export function useSummary() {
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

    const dataLoaded = { transactions: false, accounts: false, snapshots: false };

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
      
      const totalBalance = calculateAllAccountsCurrentBalance(allAccounts, allTransactions, allSnapshots);
      
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

  return { summary, loading };
}
