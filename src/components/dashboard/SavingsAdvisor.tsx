
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit } from "lucide-react";
import { useSavingsAdvisor } from "@/hooks/useSavingsAdvisor";
import { cn } from "@/lib/utils";

export function SavingsAdvisor() {
  const {
    suggestion,
    loading,
    error,
    transactions,
    handleGetSuggestion
  } = useSavingsAdvisor();
  
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
    <Card className={cn(
        "bg-gradient-to-br from-card to-muted/30",
        transactions.length === 0 && "border-dashed border-muted-foreground/30"
    )}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[hsl(var(--ai-gradient-from))] to-[hsl(var(--ai-gradient-to))] shadow-lg">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="bg-gradient-to-r from-[hsl(var(--ai-gradient-from))] to-[hsl(var(--ai-gradient-to))] bg-clip-text text-transparent">
            Consulente AI
          </CardTitle>
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
        {!suggestion && !loading && !error && (
            <p className="text-sm text-muted-foreground">Clicca il pulsante per analizzare le tue spese recenti e ottenere consigli di risparmio.</p>
        )}
        <Button
          onClick={handleGetSuggestion}
          disabled={loading || transactions.length === 0}
          className="w-full text-white bg-gradient-to-r from-[hsl(var(--ai-gradient-from))] to-[hsl(var(--ai-gradient-to))] hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "Analisi in corso..." : "Analizza le Mie Spese"}
        </Button>
        {transactions.length === 0 && !loading && (
            <p className="text-xs text-center text-muted-foreground p-2 rounded-md bg-background/50">Aggiungi alcune transazioni di spesa per abilitare l'analisi.</p>
        )}
      </CardContent>
    </Card>
  );
}
