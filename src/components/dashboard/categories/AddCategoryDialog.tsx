
"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, Loader2, ArrowDownCircle, ArrowUpCircle, Sparkles, Globe } from "lucide-react";
import { IconPicker } from "./IconPicker";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import { suggestCategoryIcon } from "@/ai/flows/suggestCategoryIcon";


const categorySchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  type: z.enum(["income", "expense", "general"]),
  icon: z.string().min(1, { message: "Seleziona un'icona." }),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: "income" | "expense";
  existingCategories: string[];
}

export function AddCategoryDialog({ open, onOpenChange, initialType = 'expense', existingCategories }: AddCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [iconSuggestionLoading, setIconSuggestionLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: initialType,
      icon: "ShoppingCart",
      color: "#444444",
    },
  });

  const categoryType = form.watch("type");
  const categoryName = form.watch("name");
  const [debouncedCategoryName] = useDebounce(categoryName, 500);
  
  useEffect(() => {
    form.reset({
      name: "",
      type: initialType,
      icon: "ShoppingCart",
      color: "#444444",
    });
  }, [initialType, form]);

  useEffect(() => {
    // Suggest icon only if the name is long enough and the user hasn't manually changed the icon
    if (debouncedCategoryName && debouncedCategoryName.length > 2 && !form.formState.dirtyFields.icon) {
      const getSuggestion = async () => {
        setIconSuggestionLoading(true);
        try {
          const icon = await suggestCategoryIcon(debouncedCategoryName);
          form.setValue("icon", icon, { shouldValidate: true });
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
      const lowerCaseName = values.name.toLowerCase();
      
      // Case-insensitive check for duplicates
      if (existingCategories.some(name => name.toLowerCase() === lowerCaseName)) {
        toast({ variant: "destructive", title: "Nome duplicato", description: "Esiste già una categoria con questo nome." });
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "categories"), {
        userId: user.uid,
        name: lowerCaseName,
        type: values.type,
        icon: values.icon,
        color: values.color,
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
    onOpenChange(isOpen);
    if (!isOpen) {
      form.reset({ name: "", type: initialType, icon: "ShoppingCart", color: "#444444" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                      onValueChange={(value) => field.onChange(value as "income" | "expense" | "general")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                           <ArrowDownCircle className="mr-2 h-4 w-4" />
                           Spesa
                        </TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
                           <ArrowUpCircle className="mr-2 h-4 w-4" />
                           Entrata
                        </TabsTrigger>
                        <TabsTrigger value="general" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                           <Globe className="mr-2 h-4 w-4" />
                           Generale
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
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
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Colore</FormLabel>
                            <FormControl>
                                <Input type="color" {...field} className="p-1 h-10"/>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

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
                categoryType === 'expense' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                categoryType === 'general' && "bg-primary hover:bg-primary/90 text-primary-foreground"
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
