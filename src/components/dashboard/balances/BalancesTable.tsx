
"use client";

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
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { useBalanceSnapshots } from "@/hooks/useBalanceSnapshots";
import { EditBalanceSnapshotDialog } from "./EditBalanceSnapshotDialog";
import { DeleteBalanceSnapshotDialog } from "./DeleteBalanceSnapshotDialog";

interface BalancesTableProps {
  accountId: string;
}

export function BalancesTable({ accountId }: BalancesTableProps) {
  const {
    snapshots,
    loading,
    editingSnapshot,
    setEditingSnapshot,
    deletingSnapshot,
    setDeletingSnapshot,
    handleDelete
  } = useBalanceSnapshots(accountId);


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
                        €{snapshot.balance.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
