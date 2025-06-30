
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
    id: string;
    name: string;
    color?: string;
}

type CategoryInfo = {
    id: string;
    name: string;
    color?: string;
    icon: string;
}

export function useTransactionsTable() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
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
      const accs: AccountInfo[] = [];
      snapshot.forEach((doc) => {
        const account = doc.data() as Omit<Account, 'id'>;
        accs.push({id: doc.id, name: account.name, color: account.color});
      });
      setAccounts(accs.sort((a,b) => a.name.localeCompare(b.name)));
    }));
    
    const catQuery = query(
      collection(db, "categories"),
      where("userId", "==", user.uid)
    );
    unsubs.push(onSnapshot(catQuery, (snapshot) => {
        const cats: CategoryInfo[] = [];
        snapshot.forEach((doc) => {
            const category = doc.data() as Category;
            cats.push({ id: doc.id, name: category.name, color: category.color, icon: category.icon });
        });
        setCategories(cats.sort((a,b) => a.name.localeCompare(b.name)));
    }));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  const accountMap = useMemo(() => {
    const map = new Map<string, Omit<AccountInfo, 'id'>>();
    accounts.forEach(acc => map.set(acc.id, { name: acc.name, color: acc.color }));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Omit<CategoryInfo, 'id' | 'name'>>();
    categories.forEach(cat => map.set(cat.name, { color: cat.color, icon: cat.icon }));
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterType === "all" ? true : t.type === filterType)
      .filter(t => filterAccount === "all" ? true : t.accountId === filterAccount)
      .filter(t => filterCategory === "all" ? true : t.category === filterCategory)
      .filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [transactions, filterType, filterAccount, filterCategory, searchTerm]);

  return {
    loading,
    filteredTransactions,
    accounts,
    categories,
    accountMap,
    categoryMap,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterAccount,
    setFilterAccount,
    filterCategory,
    setFilterCategory
  };
}
