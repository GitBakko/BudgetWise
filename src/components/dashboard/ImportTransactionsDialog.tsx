"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection, Timestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccounts } from "@/hooks/useUserAccounts";
import { useUserCategories } from "@/hooks/useUserCategories";
import type { Category } from "@/types";
import { extractTransactions } from "@/ai/flows/extractTransactionsFlow";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileImage, Trash2, ArrowLeft, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import DynamicIcon from "@/components/DynamicIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "../ui/checkbox";

const importSchema = z.object({
  accountId: z.string().min(1, { message: "Seleziona un conto." }),
  categoryId: z.string().min(1, { message: "Seleziona una categoria predefinita." }),
  transactions: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "La descrizione è obbligatoria."),
    amount: z.coerce.number().positive("L'importo deve essere positivo."),
    date: z.date({ required_error: "La data è obbligatoria." }),
    type: z.enum(['income', 'expense']),
    include: z.boolean(),
  }))
});
type ImportFormValues = z.infer<typeof importSchema>;

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type Step = "upload" | "processing" | "review";

export function ImportTransactionsDialog({ open, onOpenChange, onImportComplete }: ImportTransactionsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accounts = useUserAccounts();
  const { categories } = useUserCategories();
  const defaultGeneralCategory: Category = {
    id: 'default-general-category', name: 'generale', type: 'general',
    icon: 'Globe', color: '#444444', userId: 'system', createdAt: Timestamp.now(),
  };
  const availableCategories = [defaultGeneralCategory, ...categories.filter(c => c.type === 'expense' || c.type === 'general')];
  
  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { accountId: '', categoryId: 'generale', transactions: [] }
  });
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "transactions",
  });
  
  const resetState = () => {
    setStep("upload");
    setImageSrc(null);
    form.reset({ accountId: '', categoryId: 'generale', transactions: [] });
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStep("processing");
    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setImageSrc(dataUri);
        try {
            const results = await extractTransactions({ screenshotDataUri: dataUri });
            if (results.length === 0) {
              toast({ variant: "destructive", title: "Nessuna transazione trovata", description: "L'AI non ha trovato transazioni nell'immagine. Prova con uno screenshot più chiaro." });
              resetState();
              return;
            }

            const formattedForForm = results.map(t => ({
                id: uuidv4(),
                description: t.description,
                amount: t.amount,
                date: t.transactionDate ? new Date(t.transactionDate) : new Date(),
                type: t.type,
                include: true,
            }));

            form.reset({
                ...form.getValues(),
                transactions: formattedForForm
            });
            setStep("review");
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Errore AI", description: "Impossibile analizzare l'immagine." });
            resetState();
        }
    };
    reader.readAsDataURL(file);
  }

  const onSubmit = async (values: ImportFormValues) => {
      if (!user) return;
      const transactionsToImport = values.transactions.filter(t => t.include);
      if (transactionsToImport.length === 0) {
        toast({ variant: 'destructive', title: 'Nessuna transazione selezionata', description: 'Seleziona almeno una transazione da importare.' });
        return;
      }
      
      form.control._formState.isSubmitting = true;
      try {
        const batch = writeBatch(db);
        transactionsToImport.forEach(t => {
            const newDocRef = doc(collection(db, "transactions"));
            batch.set(newDocRef, {
                userId: user.uid,
                accountId: values.accountId,
                category: values.categoryId,
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: Timestamp.fromDate(t.date),
                createdAt: Timestamp.now(),
            });
        });
        await batch.commit();

        toast({ title: "Successo!", description: `${transactionsToImport.length} transazioni importate.` });
        onImportComplete();
      } catch (error) {
        console.error("Error importing transactions:", error);
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile salvare le transazioni.' });
      } finally {
        form.control._formState.isSubmitting = false;
      }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!form.formState.isSubmitting) { onOpenChange(isOpen); if(!isOpen) resetState(); }}}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importa Transazioni da Screenshot</DialogTitle>
          <DialogDescription>Carica uno screenshot della tua lista transazioni e lascia che l'AI le importi per te.</DialogDescription>
        </DialogHeader>
        
        {step === 'upload' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center h-80">
                <FileImage className="h-12 w-12 text-muted-foreground mb-4"/>
                <p className="text-muted-foreground mb-4">Trascina qui il tuo file o clicca per caricare</p>
                <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/> Seleziona File
                </Button>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </div>
        )}
        
        {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Analisi AI in corso...</p>
                {imageSrc && <Image src={imageSrc} alt="Anteprima screenshot" width={100} height={100} className="rounded-md object-contain h-24" />}
            </div>
        )}

        {step === 'review' && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Rivedi le Transazioni</AlertTitle>
                    <AlertDescription>
                        Controlla i dati estratti dall'AI. Puoi modificare ogni campo prima di importare.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="accountId" render={({ field }) => (
                      <FormItem><FormLabel>Conto di destinazione</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona un conto"/></SelectTrigger></FormControl><SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                    )}/>
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                      <FormItem><FormLabel>Categoria predefinita</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona una categoria"/></SelectTrigger></FormControl><SelectContent>{availableCategories.map(c => <SelectItem key={c.id} value={c.name}><div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded-sm text-primary-foreground" style={{ backgroundColor: c.color || '#444444' }}><DynamicIcon name={c.icon} className="h-3 w-3" /></div><span>{c.name}</span></div></SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                    )}/>
                </div>
                <ScrollArea className="h-72 w-full pr-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"><Checkbox checked={fields.every(f => f.include)} onCheckedChange={(checked) => fields.forEach((_, index) => update(index, {...fields[index], include: !!checked}))}/></TableHead>
                            <TableHead>Descrizione</TableHead>
                            <TableHead>Importo</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                           <TableRow key={field.id} className={cn(!field.include && "opacity-50")}>
                              <TableCell><FormField control={form.control} name={`transactions.${index}.include`} render={({field}) => <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>}/></TableCell>
                              <TableCell><FormField control={form.control} name={`transactions.${index}.description`} render={({field}) => <FormControl><Input {...field} /></FormControl>}/></TableCell>
                              <TableCell><FormField control={form.control} name={`transactions.${index}.amount`} render={({field}) => <FormControl><Input type="number" step="0.01" {...field} /></FormControl>}/></TableCell>
                              <TableCell><FormField control={form.control} name={`transactions.${index}.date`} render={({field}) => <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full justify-start font-normal">{format(field.value, 'PPP', {locale: it})}<CalendarIcon className="ml-auto h-4 w-4 opacity-50"/></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={it} /></PopoverContent></Popover>}/></TableCell>
                              <TableCell><FormField control={form.control} name={`transactions.${index}.type`} render={({field}) => <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="expense"><div className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-destructive"/> Spesa</div></SelectItem><SelectItem value="income"><div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-success"/> Entrata</div></SelectItem></SelectContent></Select>}/></TableCell>
                              <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </ScrollArea>
                <div className="flex justify-between items-center pt-4">
                  <Button type="button" variant="outline" onClick={resetState}><ArrowLeft className="mr-2 h-4 w-4"/> Indietro</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Loader2 className="animate-spin mr-2"/> Importazione...</> : `Importa ${fields.filter(f => f.include).length} Transazioni`}</Button>
                </div>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
