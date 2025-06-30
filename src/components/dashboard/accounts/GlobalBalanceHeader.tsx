"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, ChevronDown } from "lucide-react";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalBalanceHeaderProps {
  isChartOpen: boolean;
}

export function GlobalBalanceHeader({ isChartOpen }: GlobalBalanceHeaderProps) {
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
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="flex items-center justify-between bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-4">
        <PiggyBank className="h-8 w-8 flex-shrink-0" />
        <div>
            <h2 className="text-sm font-medium text-primary-foreground/80">Saldo Totale Complessivo</h2>
            <p className="text-3xl font-bold">
              €{totalBalance.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
        </div>
      </div>
      <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground rounded-full">
              <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isChartOpen && "rotate-180")} />
              <span className="sr-only">Mostra/nascondi andamento</span>
          </Button>
      </CollapsibleTrigger>
    </div>
  );
}
