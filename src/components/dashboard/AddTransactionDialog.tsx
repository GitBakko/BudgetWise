
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccounts } from "@/hooks/useUserAccounts";
import { useUserCategories } from "@/hooks/useUserCategories";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, PlusCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { it } from "date-fns/locale";
import DynamicIcon from "@/components/DynamicIcon";
import { Skeleton } from "../ui/skeleton";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive({ message: "L'importo deve essere positivo." }),
  description: z
    .string()
    .min(2, { message: "La descrizione deve contenere almeno 2 caratteri." }),
  accountId: z.string().min(1, { message: "Seleziona un conto." }),
  category: z.string().min(1, { message: "Seleziona una categoria." }),
  date: z.date(),
});

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const accounts = useUserAccounts();
  const { categories, loading: categoriesLoading } = useUserCategories();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      description: "",
      accountId: "",
      category: "",
      date: new Date(),
    },
  });

  const onTabChange = (value: string) => {
    const type = value as "income" | "expense";
    setActiveTab(type);
    form.reset({
      ...form.getValues(),
      type,
      category: "",
    });
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Devi essere loggato per aggiungere una transazione.",
      });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "transactions"), {
        ...values,
        date: Timestamp.fromDate(values.date),
        userId: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({
        title: "Successo!",
        description: "Transazione aggiunta con successo.",
      });
      form.reset({
        type: activeTab,
        amount: 0,
        description: "",
        accountId: "",
        category: "",
        date: new Date(),
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiungere la transazione. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountId = form.watch("accountId");
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const availableCategories = categories.filter((c) => c.type === activeTab);
  const selectedCategoryName = form.watch("category");
  const selectedCategory = availableCategories.find(c => c.name === selectedCategoryName);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Transazione
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuova Transazione</DialogTitle>
          <DialogDescription>
            Registra una nuova entrata o spesa per monitorare le tue finanze.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Caffè" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={accounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                           {selectedAccount ? (
                                <div className="flex items-center gap-2">
                                    {selectedAccount.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedAccount.color }} />}
                                    <span>{selectedAccount.name}</span>
                                </div>
                            ) : (
                                "Seleziona un conto"
                            )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex items-center gap-2">
                            {acc.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: acc.color }} />}
                            <span>{acc.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {accounts.length === 0 && <p className="text-xs text-muted-foreground pt-1">Devi prima creare un conto dalla sezione 'Conti'.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={categoriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                           {selectedCategory ? (
                                <div className="flex items-center gap-2">
                                    <DynamicIcon name={selectedCategory.icon} className="h-4 w-4" />
                                    <span>{selectedCategory.name}</span>
                                </div>
                            ) : (
                                "Seleziona una categoria"
                            )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                         <div className="p-2">
                            <Skeleton className="h-8 w-full" />
                         </div>
                      ) : availableCategories.length > 0 ? (
                        availableCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <DynamicIcon name={cat.icon} className="h-4 w-4" />
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            Nessuna categoria trovata.
                            <br />
                            <Button variant="link" asChild className="p-0 h-auto">
                                <Link href="/dashboard/categories">Aggiungine una</Link>
                            </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
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
            <Button 
                type="submit" 
                disabled={loading || accounts.length === 0 || availableCategories.length === 0} 
                className={cn(
                    "w-full",
                    activeTab === 'income' && "bg-success hover:bg-success/90 text-success-foreground",
                    activeTab === 'expense' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                )}>
              {loading ? "Aggiunta in corso..." : "Aggiungi Transazione"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
