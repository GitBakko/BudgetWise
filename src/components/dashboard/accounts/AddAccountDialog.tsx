"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
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
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const accountSchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  initialBalance: z.coerce.number().min(0, { message: "Il saldo iniziale non può essere negativo." }),
});

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      initialBalance: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Devi essere loggato per aggiungere un conto.",
      });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "accounts"), {
        ...values,
        userId: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({
        title: "Successo!",
        description: "Conto aggiunto con successo.",
      });
      form.reset({
        name: "",
        initialBalance: 0,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiungere il conto. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Conto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Conto</DialogTitle>
          <DialogDescription>
            Crea un nuovo conto per tracciare entrate e uscite.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Conto</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Conto Corrente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Iniziale</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Aggiunta in corso..." : "Aggiungi Conto"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
