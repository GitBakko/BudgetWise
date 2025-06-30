"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc } from "firebase/firestore";
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
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Landmark, Loader2, Upload } from "lucide-react";

const accountSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  initialBalance: z.coerce
    .number()
    .min(0, { message: "Il saldo iniziale non può essere negativo." }),
  iconUrl: z.string().optional(),
});

interface EditAccountDialogProps {
    account: Account;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditAccountDialog({ account, open, onOpenChange }: EditAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconPreview, setIconPreview] = useState<string | undefined>(account.iconUrl);

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account.name,
      initialBalance: account.initialBalance,
      iconUrl: account.iconUrl || "",
    },
  });
  
  useEffect(() => {
    form.reset({
        name: account.name,
        initialBalance: account.initialBalance,
        iconUrl: account.iconUrl || "",
    });
    setIconPreview(account.iconUrl);
  }, [account, form, open]);


  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Devi essere loggato per modificare un conto.",
      });
      return;
    }
    setLoading(true);
    try {
      const accountRef = doc(db, "accounts", account.id);
      await updateDoc(accountRef, {
        name: values.name,
        initialBalance: values.initialBalance,
        iconUrl: values.iconUrl || "",
      });
      toast({
        title: "Successo!",
        description: "Conto modificato con successo.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile modificare il conto. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setIconPreview(dataUrl);
            form.setValue("iconUrl", dataUrl, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
    } else if (file) {
        toast({ variant: "destructive", title: "File non valido", description: "Seleziona un file immagine (es. JPG, PNG)." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Conto</DialogTitle>
          <DialogDescription>
            Aggiorna i dettagli del tuo conto.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Icona Conto</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={iconPreview || undefined} alt={account.name} />
                    <AvatarFallback>
                        <Landmark className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                    <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Cambia Immagine
                    </Button>
                </div>
              </div>
            </div>
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
                   <p className="text-xs text-muted-foreground pt-1">Questo valore è usato solo se non ci sono saldi a data impostati.</p>
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
