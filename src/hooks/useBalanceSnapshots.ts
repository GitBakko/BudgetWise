"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { BalanceSnapshot } from "@/types";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useBalanceSnapshots(accountId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSnapshot, setEditingSnapshot] = useState<BalanceSnapshot | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<BalanceSnapshot | null>(null);

  useEffect(() => {
    if (!user || !accountId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "balanceSnapshots"),
      where("userId", "==", user.uid),
      where("accountId", "==", accountId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: BalanceSnapshot[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as BalanceSnapshot);
        });
        data.sort((a, b) => b.date.seconds - a.date.seconds);
        setSnapshots(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching balance snapshots:", error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile caricare i saldi storici.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, accountId, toast]);

  const handleDelete = async () => {
    if (!deletingSnapshot) return;
    try {
      await deleteDoc(doc(db, "balanceSnapshots", deletingSnapshot.id));
      toast({
        title: "Successo",
        description: "Saldo storico eliminato.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile eliminare il saldo. Riprova.",
      });
    } finally {
      setDeletingSnapshot(null);
    }
  };

  return {
    snapshots,
    loading,
    editingSnapshot,
    setEditingSnapshot,
    deletingSnapshot,
    setDeletingSnapshot,
    handleDelete,
  };
}
