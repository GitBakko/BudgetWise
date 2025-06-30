"use client";

import { useState, useEffect, useMemo } from "react";
import { savingsAdvisor } from "@/ai/flows/savingsAdvisor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BrainCircuit } from "lucide-react";

export function SavingsAdvisor() {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    // This query fetches all transactions for the user.
    // Sorting and filtering are done on the client-side to avoid needing a composite index in Firestore.
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTransactions: Transaction[] = [];
      snapshot.forEach((doc) =>
        allTransactions.push({ id: doc.id, ...doc.data() } as Transaction)
      );

      // Sort by date descending, then filter for expenses and take the most recent ones.
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
  
  const formattedSuggestion = useMemo(() => {
    if (!suggestion) return null;
    return suggestion.split('\n').map((line, index) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>
        }
        return <p key={index}>{line}</p>;
    });
  }, [suggestion]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <CardTitle>Consulente AI per il Risparmio</CardTitle>
        </div>
        <CardDescription>
          Ottieni consigli personalizzati per migliorare i tuoi risparmi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {error && <p className="text-destructive">{error}</p>}
        {suggestion && !loading && (
          <div className="prose prose-sm dark:prose-invert text-foreground rounded-lg bg-muted/50 p-4">
            <ul>
              {formattedSuggestion}
            </ul>
          </div>
        )}
        {!suggestion && !loading && (
            <p className="text-sm text-muted-foreground">Clicca il pulsante per analizzare le tue spese recenti e ottenere consigli di risparmio.</p>
        )}
        <Button
          onClick={handleGetSuggestion}
          disabled={loading || transactions.length === 0}
          className="w-full"
        >
          {loading ? "Analisi in corso..." : "Analizza le Mie Spese"}
        </Button>
        {transactions.length === 0 && !loading && (
            <p className="text-xs text-center text-muted-foreground">Aggiungi alcune transazioni di spesa per abilitare l'analisi.</p>
        )}
      </CardContent>
    </Card>
  );
}
