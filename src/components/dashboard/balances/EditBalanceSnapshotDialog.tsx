"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  doc,
} from "firebase/firestore";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BalanceSnapshot } from "@/types";
import { startOfDay, format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

const balanceSchema = z.object({
  balance: z.coerce
    .number()
    .min(0, { message: "Il saldo non può essere negativo." }),
  date: z.date(),
});

interface EditBalanceSnapshotDialogProps {
  snapshot: BalanceSnapshot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBalanceSnapshotDialog({
  snapshot,
  open,
  onOpenChange,
}: EditBalanceSnapshotDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof balanceSchema>>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      balance: snapshot.balance,
      date: snapshot.date.toDate(),
    },
  });

  const onSubmit = async (values: z.infer<typeof balanceSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Devi essere loggato.",
      });
      return;
    }
    setLoading(true);

    try {
      const snapshotDate = startOfDay(values.date);
      const snapshotTimestamp = Timestamp.fromDate(snapshotDate);

      // Check if another snapshot already exists for the new date
      if (snapshotDate.getTime() !== snapshot.date.toDate().getTime()) {
        const q = query(
          collection(db, "balanceSnapshots"),
          where("accountId", "==", snapshot.accountId),
          where("date", "==", snapshotTimestamp)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast({
            variant: "destructive",
            title: "Data già esistente",
            description: "Esiste già un saldo registrato per questa data. Modifica quello esistente o scegline un'altra.",
          });
          setLoading(false);
          return;
        }
      }

      const docRef = doc(db, "balanceSnapshots", snapshot.id);
      await updateDoc(docRef, {
        balance: values.balance,
        date: snapshotTimestamp,
      });

      toast({
        title: "Successo!",
        description: "Saldo storico aggiornato con successo.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare il saldo. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Saldo Storico</DialogTitle>
          <DialogDescription>
            Aggiorna la data o l'importo per questo saldo registrato.
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                "Salva Modifiche"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
