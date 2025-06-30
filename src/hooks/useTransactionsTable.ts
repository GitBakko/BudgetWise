
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account, Category } from "@/types";
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

type CategoryInfo = {
    color?: string;
    icon: string;
}

export function useTransactionsTable() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Map<string, AccountInfo>>(new Map());
  const [categories, setCategories] = useState<Map<string, CategoryInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubs: (()=>void)[] = [];

    const transQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    unsubs.push(onSnapshot(
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

        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      }
    ));

    const accQuery = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    unsubs.push(onSnapshot(accQuery, (snapshot) => {
      const accsMap = new Map<string, AccountInfo>();
      snapshot.forEach((doc) => {
        const account = doc.data() as Omit<Account, 'id'>;
        accsMap.set(doc.id, {name: account.name, color: account.color});
      });
      setAccounts(accsMap);
    }));
    
    const catQuery = query(
      collection(db, "categories"),
      where("userId", "==", user.uid)
    );
    unsubs.push(onSnapshot(catQuery, (snapshot) => {
        const catsMap = new Map<string, CategoryInfo>();
        snapshot.forEach((doc) => {
            const category = doc.data() as Category;
            catsMap.set(category.name, { color: category.color, icon: category.icon });
        });
        setCategories(catsMap);
    }));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) =>
        filterType === "all" ? true : t.type === filterType
      )
      .filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [transactions, filterType, searchTerm]);

  return {
    loading,
    filteredTransactions,
    accounts,
    categories,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
  };
}
