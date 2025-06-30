"use client";

import { useState, useEffect } from "react";
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
import { Image as ImageIcon, PlusCircle, Loader2 } from "lucide-react";
import { generateAccountIcon } from "@/ai/flows/generateIconFlow";
import { useDebounce } from "use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const accountSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  initialBalance: z.coerce
    .number()
    .min(0, { message: "Il saldo iniziale non può essere negativo." }),
  iconUrl: z.string().optional(),
});

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [iconPreview, setIconPreview] = useState<string>("");
  const [iconLoading, setIconLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      initialBalance: 0,
      iconUrl: "",
    },
  });

  const accountNameValue = form.watch("name");
  const [debouncedAccountName] = useDebounce(accountNameValue, 1000);

  useEffect(() => {
    if (debouncedAccountName && debouncedAccountName.length > 2) {
      const generateIcon = async () => {
        setIconLoading(true);
        setIconPreview("");
        try {
          const url = await generateAccountIcon(debouncedAccountName);
          setIconPreview(url);
          form.setValue("iconUrl", url);
        } catch (error) {
          console.error("Failed to generate icon:", error);
        } finally {
          setIconLoading(false);
        }
      };
      generateIcon();
    } else {
      setIconPreview("");
      form.setValue("iconUrl", "");
    }
  }, [debouncedAccountName, form]);

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
        name: values.name,
        initialBalance: values.initialBalance,
        iconUrl: values.iconUrl || "",
        userId: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({
        title: "Successo!",
        description: "Conto aggiunto con successo.",
      });
      handleOpenChange(false);
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

  const handleOpenChange = (isOpen: boolean) => {
    if (loading && !isOpen) return;

    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ name: "", initialBalance: 0, iconUrl: "" });
      setIconPreview("");
      setIconLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {iconLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  <>
                    <AvatarImage
                      src={iconPreview || undefined}
                      alt="Anteprima icona conto"
                    />
                    <AvatarFallback className="bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <p className="text-sm text-muted-foreground">
                L'icona viene generata automaticamente in base al nome del
                conto.
              </p>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading || iconLoading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Aggiunta in corso...</span>
                </>
              ) : (
                "Aggiungi Conto"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
