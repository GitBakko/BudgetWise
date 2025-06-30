"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BalanceSnapshot } from "@/types";
import { Loader2 } from "lucide-react";

interface DeleteBalanceSnapshotDialogProps {
  snapshot: BalanceSnapshot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBalanceSnapshotDialog({
  snapshot,
  open,
  onOpenChange,
  onConfirm,
}: DeleteBalanceSnapshotDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione non può essere annullata. Questo eliminerà
            permanentemente il saldo di{" "}
            <span className="font-semibold text-foreground">
              €{snapshot.balance.toFixed(2)}
            </span>{" "}
            registrato in data{" "}
            <span className="font-semibold text-foreground">
              {format(snapshot.date.toDate(), "PPP", { locale: it })}
            </span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Eliminazione...</span>
              </>
            ) : (
              "Sì, elimina saldo"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
