"use client";

import { useState, useEffect, useMemo } from "react";
import { run } from "@genkit-ai/next/client";
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
  orderBy,
  limit,
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

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("type", "==", "expense"),
      orderBy("date", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans: Transaction[] = [];
      snapshot.forEach((doc) => trans.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError("");
    setSuggestion("");
    try {
      const result = await run(savingsAdvisor, transactions);
      setSuggestion(result);
    } catch (err) {
      setError("Sorry, I couldn't generate a suggestion right now.");
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
            <CardTitle>AI Savings Advisor</CardTitle>
        </div>
        <CardDescription>
          Get personalized tips to improve your savings.
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
            <p className="text-sm text-muted-foreground">Click the button to analyze your recent expenses and get savings tips.</p>
        )}
        <Button
          onClick={handleGetSuggestion}
          disabled={loading || transactions.length === 0}
          className="w-full"
        >
          {loading ? "Analyzing..." : "Analyze My Spending"}
        </Button>
        {transactions.length === 0 && !loading && (
            <p className="text-xs text-center text-muted-foreground">Add some expense transactions to enable analysis.</p>
        )}
      </CardContent>
    </Card>
  );
}
