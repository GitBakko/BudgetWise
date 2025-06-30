
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccounts } from "@/hooks/useUserAccounts";
import { useUserCategories } from "@/hooks/useUserCategories";
import type { Category, Transaction } from "@/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ArrowDownCircle, ArrowUpCircle, Landmark, Globe, ScanLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { it } from "date-fns/locale";
import DynamicIcon from "@/components/DynamicIcon";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScanReceiptDialog } from "./ScanReceiptDialog";
import type { OcrReceiptOutput } from "@/ai/flows/receiptOcrFlow";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive({ message: "L'importo deve essere positivo." }),
  description: z.string().min(2, { message: "La descrizione deve contenere almeno 2 caratteri." }),
  accountId: z.string().min(1, { message: "Seleziona un conto." }),
  category: z.string().min(1, { message: "Seleziona una categoria." }),
  date: z.date(),
  notes: z.string().optional(),
});

interface EditTransactionDialogProps {
    transaction: Transaction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"income" | "expense">(transaction.type);
  const accounts = useUserAccounts();
  const { categories, loading: categoriesLoading } = useUserCategories();
  
  const [isScanOpen, setScanOpen] = useState(false);

  const defaultGeneralCategory: Category = {
    id: 'default-general-category', name: 'generale', type: 'general',
    icon: 'Globe', color: '#444444', userId: 'system', createdAt: Timestamp.now(),
  };

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      accountId: transaction.accountId,
      category: transaction.category,
      date: transaction.date.toDate(),
      notes: transaction.notes || "",
    },
  });

  useEffect(() => {
    if(open) {
        form.reset({
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.accountId,
            category: transaction.category,
            date: transaction.date.toDate(),
            notes: transaction.notes || "",
        });
        setActiveTab(transaction.type);
    }
  }, [open, transaction, form]);
  

  const onTabChange = (value: string) => {
    const type = value as "income" | "expense";
    setActiveTab(type);
    form.setValue("type", type);
    form.setValue("category", "");
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "Errore", description: "Devi essere loggato." });
      return;
    }
    setLoading(true);
    try {
      const transactionRef = doc(db, "transactions", transaction.id);
      await updateDoc(transactionRef, {
        ...values,
        date: Timestamp.fromDate(values.date),
      });
      toast({ title: "Successo!", description: "Transazione aggiornata." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiornare la transazione." });
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = (data: OcrReceiptOutput) => {
    if (data.merchantName) form.setValue('description', data.merchantName, { shouldValidate: true });
    if (data.totalAmount) form.setValue('amount', data.totalAmount, { shouldValidate: true });
    if (data.transactionDate) {
        const parsedDate = new Date(data.transactionDate);
        if (!isNaN(parsedDate.getTime())) {
            form.setValue('date', parsedDate, { shouldValidate: true });
        }
    }

    const notesContent = [
      `--- Dati Scontrino ---`,
      `Negozio: ${data.merchantName || 'N/D'}`,
      `Importo: €${data.totalAmount?.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || 'N/D'}`,
      `Data: ${data.transactionDate || 'N/D'}`,
      `--------------------`,
    ].join('\n');

    const existingNotes = form.getValues('notes');
    form.setValue('notes', existingNotes ? `${existingNotes}\n\n${notesContent}` : notesContent, { shouldValidate: true });
    
    setScanOpen(false);
  };

  const selectedAccountId = form.watch("accountId");
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const userCategories = categories.filter((c) => c.type === activeTab || c.type === 'general');
  const availableCategories = [defaultGeneralCategory, ...userCategories];
  const selectedCategoryName = form.watch("category");
  const selectedCategory = availableCategories.find(c => c.name === selectedCategoryName);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Transazione</DialogTitle>
            <DialogDescription>Aggiorna i dettagli di questa transazione.</DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"><ArrowDownCircle className="mr-2 h-4 w-4" />Spesa</TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success"><ArrowUpCircle className="mr-2 h-4 w-4" />Entrata</TabsTrigger>
            </TabsList>
          </Tabs>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                 <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>Importo</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => setScanOpen(true)}>
                        <ScanLine className="h-5 w-5" />
                        <span className="sr-only">Scansiona Scontrino</span>
                    </Button>
                 </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descrizione</FormLabel><FormControl><Input placeholder="es. Caffè" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="accountId" render={({ field }) => (
                  <FormItem><FormLabel>Conto</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={accounts.length === 0}><FormControl><SelectTrigger><SelectValue>
                    {selectedAccount ? (<div className="flex items-center gap-3"><Avatar className="h-6 w-6 rounded-md"><AvatarImage src={selectedAccount.iconUrl || undefined} alt={selectedAccount.name}/><AvatarFallback className="rounded-md bg-muted text-xs"><Landmark className="h-4 w-4 text-muted-foreground" /></AvatarFallback></Avatar><div className="flex items-center gap-2">{selectedAccount.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedAccount.color }} />}<span>{selectedAccount.name}</span></div></div>) : ("Seleziona un conto")}
                  </SelectValue></SelectTrigger></FormControl><SelectContent>
                    {accounts.map((acc) => (<SelectItem key={acc.id} value={acc.id}><div className="flex items-center gap-3"><Avatar className="h-6 w-6 rounded-md"><AvatarImage src={acc.iconUrl || undefined} alt={acc.name}/><AvatarFallback className="rounded-md bg-muted text-xs"><Landmark className="h-4 w-4 text-muted-foreground" /></AvatarFallback></Avatar><div className="flex items-center gap-2">{acc.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: acc.color }} />}<span>{acc.name}</span></div></div></SelectItem>))}
                  </SelectContent></Select>{accounts.length === 0 && <p className="text-xs text-muted-foreground pt-1">Devi prima creare un conto.</p>}<FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={categoriesLoading}><FormControl><SelectTrigger><SelectValue>
                    {selectedCategory ? (<div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded-sm text-primary-foreground" style={{ backgroundColor: selectedCategory.color || '#444444' }}><DynamicIcon name={selectedCategory.icon} className="h-3 w-3" /></div><span>{selectedCategory.name}</span></div>) : ("Seleziona una categoria")}
                  </SelectValue></SelectTrigger></FormControl><SelectContent>
                    {categoriesLoading ? (<div className="p-2"><Skeleton className="h-8 w-full" /></div>) : availableCategories.length > 0 ? (
                      availableCategories.map((cat) => (<SelectItem key={cat.id} value={cat.name}><div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded-sm text-primary-foreground" style={{ backgroundColor: cat.color || '#444444' }}><DynamicIcon name={cat.icon} className="h-3 w-3" /></div><span>{cat.name}</span></div></SelectItem>))
                    ) : (<div className="text-center text-sm text-muted-foreground p-4">Nessuna categoria. <Button variant="link" asChild className="p-0 h-auto"><Link href="/dashboard/categories">Aggiungine una</Link></Button></div>)}
                  </SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? (format(field.value, "PPP", { locale: it })) : (<span>Scegli una data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={it} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Note (opzionale)</FormLabel><FormControl><Textarea placeholder="Aggiungi dettagli extra qui..." {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salva Modifiche"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ScanReceiptDialog open={isScanOpen} onOpenChange={setScanOpen} onScanComplete={handleScanComplete} />
    </>
  );
}
