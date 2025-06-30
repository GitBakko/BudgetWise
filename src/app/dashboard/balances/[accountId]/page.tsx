"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";

import { BalancesTable } from "@/components/dashboard/balances/BalancesTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BalancesPage() {
  const params = useParams();
  const { user } = useAuth();
  const accountId = params.accountId as string;
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !accountId) return;

    const docRef = doc(db, "accounts", accountId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists() && doc.data().userId === user.uid) {
        setAccount({ id: doc.id, ...doc.data() } as Account);
      } else {
        // Handle case where account is not found or doesn't belong to the user
        setAccount(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, accountId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href="/dashboard/accounts">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Torna ai conti</span>
            </Link>
        </Button>
        {loading ? (
          <Skeleton className="h-8 w-64" />
        ) : account ? (
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={account.iconUrl} alt={account.name}/>
                <AvatarFallback className="rounded-md">{account.name.charAt(0)}</AvatarFallback>
             </Avatar>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Saldi Storici per {account.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                    Visualizza, modifica o elimina i saldi registrati per questo conto.
                </p>
            </div>
          </div>
        ) : (
             <h1 className="text-2xl font-bold tracking-tight">Conto non trovato</h1>
        )}
      </div>

      {account ? (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <BalancesTable accountId={accountId} />
        </Suspense>
      ) : !loading ? (
        <div className="text-center py-16 text-muted-foreground">
            <p>Il conto che stai cercando non esiste o non hai i permessi per vederlo.</p>
        </div>
      ) : null}
    </div>
  );
}
