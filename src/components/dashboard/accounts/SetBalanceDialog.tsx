
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, query, where, getDocs, addDoc, updateDoc, Timestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/types";
import { startOfDay, format } from 'date-fns';
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

const balanceSchema = z.object({
  balance: z.coerce
    .number()
    .min(0, { message: "Il saldo non può essere negativo." }),
  date: z.date(),
});

interface SetBalanceDialogProps {
    account: Account;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SetBalanceDialog({ account, open, onOpenChange }: SetBalanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof balanceSchema>>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      balance: 0,
      date: new Date(),
    },
  });
  
  const onSubmit = async (values: z.infer<typeof balanceSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "Errore", description: "Devi essere loggato." });
      return;
    }
    setLoading(true);

    try {
        const snapshotDate = startOfDay(values.date);
        const snapshotTimestamp = Timestamp.fromDate(snapshotDate);

        const q = query(
            collection(db, "balanceSnapshots"),
            where("accountId", "==", account.id),
            where("date", "==", snapshotTimestamp)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // No snapshot for this day, create a new one
            await addDoc(collection(db, "balanceSnapshots"), {
                userId: user.uid,
                accountId: account.id,
                date: snapshotTimestamp,
                balance: values.balance
            });
        } else {
            // Snapshot exists, update it
            const existingSnapshotDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, "balanceSnapshots", existingSnapshotDoc.id), {
                balance: values.balance
            });
        }
        
      toast({
        title: "Successo!",
        description: "Saldo a data impostato con successo.",
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile impostare il saldo. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Imposta Saldo per {account.name}</DialogTitle>
          <DialogDescription>
            Definisci il saldo del conto in una data specifica. Questo sovrascriverà il calcolo basato sulle transazioni fino a quella data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data del Saldo</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: it })
                            ) : (
                                <span>Scegli una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={it}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo a quella data</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvataggio..." : "Salva Saldo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
