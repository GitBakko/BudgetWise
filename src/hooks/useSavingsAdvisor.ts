"use client";

import { useState, useEffect } from "react";
import { savingsAdvisor } from "@/ai/flows/savingsAdvisor";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useSavingsAdvisor() {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTransactions: Transaction[] = [];
      snapshot.forEach((doc) =>
        allTransactions.push({ id: doc.id, ...doc.data() } as Transaction)
      );

      allTransactions.sort((a, b) => b.date.seconds - a.date.seconds);
      const expenseTransactions = allTransactions
        .filter((t) => t.type === "expense")
        .slice(0, 50);

      setTransactions(expenseTransactions);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError("");
    setSuggestion("");
    try {
      const result = await savingsAdvisor(transactions);
      setSuggestion(result);
    } catch (err) {
      setError("Spiacente, non sono riuscito a generare un suggerimento in questo momento.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { suggestion, loading, error, transactions, handleGetSuggestion };
}
