"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account } from "@/types";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type AccountInfo = {
    name: string;
    color?: string;
}

export function useRecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Map<string, AccountInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const transQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const unsubTransactions = onSnapshot(
      transQuery,
      (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data(),
          } as Transaction);
        });
        
        transactionsData.sort((a, b) => b.date.seconds - a.date.seconds);
        
        setTransactions(transactionsData.slice(0, 5));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recent transactions:", error);
        setLoading(false);
      }
    );

    const accQuery = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    const unsubAccounts = onSnapshot(accQuery, (snapshot) => {
      const accsMap = new Map<string, AccountInfo>();
      snapshot.forEach((doc) => {
        const account = doc.data() as Omit<Account, "id">;
        accsMap.set(doc.id, { name: account.name, color: account.color });
      });
      setAccounts(accsMap);
    });

    return () => {
      unsubTransactions();
      unsubAccounts();
    };
  }, [user]);

  return { transactions, accounts, loading };
}
