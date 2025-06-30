
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, Timestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Loader2 } from "lucide-react";
import { IconPicker } from "./IconPicker";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, { message: "Seleziona un'icona." }),
});

type FormValues = z.infer<typeof categorySchema>;

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "ShoppingCart",
    },
  });

  const categoryType = form.watch("type");

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Errore", description: "Devi essere loggato." });
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate category name for the same user and type
      const q = query(
        collection(db, "categories"),
        where("userId", "==", user.uid),
        where("type", "==", values.type),
        where("name", "==", values.name)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast({ variant: "destructive", title: "Nome duplicato", description: "Esiste già una categoria con questo nome." });
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "categories"), {
        userId: user.uid,
        name: values.name,
        type: values.type,
        icon: values.icon,
        createdAt: Timestamp.now(),
      });

      toast({ title: "Successo!", description: "Categoria aggiunta con successo." });
      handleOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiungere la categoria." });
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (loading && !isOpen) return;
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ name: "", type: "expense", icon: "ShoppingCart" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova Categoria</DialogTitle>
          <DialogDescription>Crea una nuova categoria per le tue transazioni.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as "income" | "expense")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">Spesa</TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">Entrata</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Spesa Alimentare" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icona</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={loading} 
              className={cn(
                "w-full",
                categoryType === 'income' && "bg-success hover:bg-success/90 text-success-foreground",
                categoryType === 'expense' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creazione...
                </>
              ) : (
                "Crea Categoria"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
