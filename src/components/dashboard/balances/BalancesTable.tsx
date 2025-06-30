"use client";

import { useEffect, useState, useMemo } from "react";
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
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { EditBalanceSnapshotDialog } from "./EditBalanceSnapshotDialog";
import { DeleteBalanceSnapshotDialog } from "./DeleteBalanceSnapshotDialog";

interface BalancesTableProps {
  accountId: string;
}

export function BalancesTable({ accountId }: BalancesTableProps) {
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

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Saldo Registrato</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.length > 0 ? (
                  snapshots.map((snapshot) => (
                    <TableRow key={snapshot.id}>
                      <TableCell className="font-medium">
                        {format(snapshot.date.toDate(), "PPP", { locale: it })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{snapshot.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Apri menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditingSnapshot(snapshot)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Modifica</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setDeletingSnapshot(snapshot)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Elimina</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nessun saldo storico trovato per questo conto.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {editingSnapshot && (
        <EditBalanceSnapshotDialog
          snapshot={editingSnapshot}
          open={!!editingSnapshot}
          onOpenChange={(isOpen) => !isOpen && setEditingSnapshot(null)}
        />
      )}
      
      {deletingSnapshot && (
        <DeleteBalanceSnapshotDialog
          snapshot={deletingSnapshot}
          open={!!deletingSnapshot}
          onOpenChange={(isOpen) => !isOpen && setDeletingSnapshot(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
