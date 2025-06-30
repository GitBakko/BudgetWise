"use client";

import { useState } from "react";
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
import type { Account } from "@/types";
import { Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    // No need to set loading to false, as the component will unmount
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione non può essere annullata. Questo eliminerà
            permanentemente il conto{" "}
            <span className="font-semibold text-foreground">{account.name}</span>{" "}
            e tutti i dati associati (transazioni, saldi storici).
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
              "Sì, elimina il conto"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
