"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";
import Papa from "papaparse";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const importSchema = z.object({
  accountId: z.string().min(1, { message: "Seleziona un conto." }),
  file: z.instanceof(FileList).refine((files) => files?.length === 1, "È richiesto un file."),
});

export function ImportBalancesDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);

  const form = useForm<z.infer<typeof importSchema>>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      accountId: "",
    },
  });

  useEffect(() => {
    if (!user || !open) return;
    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accs: Account[] = [];
      snapshot.forEach((doc) => accs.push({ id: doc.id, ...doc.data() } as Account));
      setAccounts(accs);
    });
    return () => unsubscribe();
  }, [user, open]);

  const onSubmit = async (values: z.infer<typeof importSchema>) => {
    setLoading(true);
    const file = values.file[0];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data, errors, meta } = results;

        if (errors.length > 0) {
            toast({ variant: "destructive", title: "Errore nel file CSV", description: "Controlla il formato del file e riprova." });
            setLoading(false);
            return;
        }

        if (!meta.fields?.includes("date") || !meta.fields?.includes("balance")) {
             toast({ variant: "destructive", title: "Intestazioni mancanti", description: "Il file CSV deve contenere le colonne 'date' e 'balance'." });
             setLoading(false);
             return;
        }

        try {
            const batch = writeBatch(db);
            let processedCount = 0;

            for (const row of data as { date: string, balance: string }[]) {
                const date = new Date(row.date);
                const balance = parseFloat(row.balance);

                if (isNaN(date.getTime()) || isNaN(balance)) {
                    console.warn("Riga saltata per dati non validi:", row);
                    continue;
                }

                const snapshotTimestamp = Timestamp.fromDate(date);
                
                // Query to find if a snapshot for this date already exists
                const q = query(
                    collection(db, "balanceSnapshots"),
                    where("accountId", "==", values.accountId),
                    where("date", "==", snapshotTimestamp)
                );
                
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    // No existing snapshot, add a new one
                    const newSnapshotRef = collection(db, "balanceSnapshots").doc();
                    batch.set(newSnapshotRef, {
                        userId: user!.uid,
                        accountId: values.accountId,
                        date: snapshotTimestamp,
                        balance: balance
                    });
                } else {
                    // Existing snapshot, update it
                    const existingSnapshotDoc = querySnapshot.docs[0];
                    batch.update(existingSnapshotDoc.ref, { balance: balance });
                }
                processedCount++;
            }

            await batch.commit();

            toast({ title: "Successo!", description: `${processedCount} saldi importati con successo.`});
            setOpen(false);
            form.reset();

        } catch (error) {
            console.error("Errore durante l'importazione:", error);
            toast({ variant: "destructive", title: "Errore di importazione", description: "Impossibile salvare i dati. Riprova."});
        } finally {
            setLoading(false);
        }
      },
      error: () => {
        toast({ variant: "destructive", title: "Errore", description: "Impossibile leggere il file CSV." });
        setLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importa Saldi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importa Saldi da CSV</DialogTitle>
          <DialogDescription>
            Carica un file CSV con la cronologia dei saldi per un conto. Il file deve contenere le colonne `date` (formato AAAA-MM-GG) e `balance`.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={accounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un conto di destinazione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>File CSV</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept=".csv"
                                onChange={(e) => field.onChange(e.target.files)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <Button type="submit" disabled={loading || accounts.length === 0} className="w-full">
              {loading ? "Importazione..." : "Importa File"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
