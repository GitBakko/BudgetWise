
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2, ArrowDownCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import { IconPicker } from "./IconPicker";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import { suggestCategoryIcon } from "@/ai/flows/suggestCategoryIcon";

const categorySchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, { message: "Seleziona un'icona." }),
});

type FormValues = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [iconSuggestionLoading, setIconSuggestionLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      type: category.type,
      icon: category.icon,
    },
  });

  const categoryType = form.watch("type");
  const categoryName = form.watch("name");
  const [debouncedCategoryName] = useDebounce(categoryName, 1000);

  useEffect(() => {
    if (open) {
      form.reset({
        name: category.name,
        type: category.type,
        icon: category.icon,
      });
    }
  }, [category, open, form]);

  useEffect(() => {
    // Suggest icon only if the name is long enough and the user hasn't manually changed the icon
    if (debouncedCategoryName && debouncedCategoryName.length > 2 && !form.formState.dirtyFields.icon) {
      const getSuggestion = async () => {
        setIconSuggestionLoading(true);
        try {
          const icon = await suggestCategoryIcon(debouncedCategoryName);
          form.setValue("icon", icon, { shouldDirty: true });
        } catch (error) {
          console.error("Failed to suggest icon:", error);
        } finally {
          setIconSuggestionLoading(false);
        }
      };
      getSuggestion();
    }
  }, [debouncedCategoryName, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Errore", description: "Devi essere loggato." });
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate category name if name has changed
      if (values.name !== category.name || values.type !== category.type) {
          const q = query(
            collection(db, "categories"),
            where("userId", "==", user.uid),
            where("type", "==", values.type),
            where("name", "==", values.name)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            toast({ variant: "destructive", title: "Nome duplicato", description: "Esiste già una categoria con questo nome e tipo." });
            setLoading(false);
            return;
          }
      }

      const categoryRef = doc(db, "categories", category.id);
      await updateDoc(categoryRef, {
        name: values.name,
        type: values.type,
        icon: values.icon,
      });

      toast({ title: "Successo!", description: "Categoria aggiornata con successo." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiornare la categoria." });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Categoria</DialogTitle>
          <DialogDescription>Aggiorna i dettagli della tua categoria.</DialogDescription>
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
                        <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                           <ArrowDownCircle className="mr-2 h-4 w-4" />
                           Spesa
                        </TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
                           <ArrowUpCircle className="mr-2 h-4 w-4" />
                           Entrata
                        </TabsTrigger>
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
                   <div className="flex justify-between items-center">
                    <FormLabel>Icona</FormLabel>
                    {iconSuggestionLoading && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                          <Sparkles className="h-3 w-3 text-primary"/>
                          <span>Suggerisco...</span>
                      </div>
                    )}
                  </div>
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
                  Salvataggio...
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
