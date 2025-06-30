"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";
import Papa from "papaparse";
import { startOfDay, format, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";

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
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Loader2,
  Landmark,
  FileCheck2,
  CopyCheck,
  FileX2,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const importSchema = z.object({
  accountId: z.string().min(1, { message: "Seleziona un conto." }),
  file: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, "È richiesto un file."),
});

type ImportFormValues = z.infer<typeof importSchema>;

type PreviewData = {
  accountId: string;
  accountName: string;
  totalRows: number;
  newCount: number;
  overwrittenCount: number;
  invalidCount: number;
  months: string[];
  rowsToImport: { date: Date; balance: number; existingDocId?: string }[];
};

export function ImportBalancesDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      accountId: "",
    },
  });

  useEffect(() => {
    if (!user || !open) return;
    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accs: Account[] = [];
      snapshot.forEach((doc) =>
        accs.push({ id: doc.id, ...doc.data() } as Account)
      );
      accs.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(accs);
    });
    return () => unsubscribe();
  }, [user, open]);

  const handleReset = () => {
    form.reset();
    setStep("upload");
    setPreviewData(null);
    setLoading(false);
  };

  const onGeneratePreview = (values: ImportFormValues) => {
    setLoading(true);
    const file = values.file[0];
    const account = accounts.find((a) => a.id === values.accountId);
    if (!account) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Conto non trovato.",
      });
      setLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data, errors, meta } = results;

        if (errors.length > 0) {
          toast({
            variant: "destructive",
            title: "Errore nel file CSV",
            description: "Controlla il formato del file e riprova.",
          });
          setLoading(false);
          return;
        }

        if (!meta.fields?.includes("date") || !meta.fields?.includes("balance")) {
          toast({
            variant: "destructive",
            title: "Intestazioni mancanti",
            description: "Il file CSV deve contenere le colonne 'date' e 'balance'.",
          });
          setLoading(false);
          return;
        }

        try {
          // Fetch existing snapshots for the account to compare against
          const q = query(
            collection(db, "balanceSnapshots"),
            where("accountId", "==", values.accountId)
          );
          const querySnapshot = await getDocs(q);
          const existingSnapshots = new Map<number, string>(); // Map<timestamp_ms, docId>
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            existingSnapshots.set(data.date.toDate().getTime(), doc.id);
          });

          // Process CSV data to build preview
          const rawData = data as { date: string, balance: string }[];
          let invalidCount = 0;

          const processedRows = rawData.map(row => {
              const date = new Date(row.date);
              const balance = parseFloat(row.balance);

              if (isNaN(date.getTime()) || isNaN(balance)) {
                  invalidCount++;
                  return null;
              }
              return { date, balance };
          }).filter(Boolean) as { date: Date; balance: number }[];

          processedRows.sort((a, b) => a.date.getTime() - b.date.getTime());

          let newCount = 0;
          let overwrittenCount = 0;
          const months = new Set<string>();
          const rowsToImport: PreviewData["rowsToImport"] = [];

          for (const row of processedRows) {
            const normalizedDate = startOfDay(row.date);
            const existingDocId = existingSnapshots.get(
              normalizedDate.getTime()
            );

            if (existingDocId) {
              overwrittenCount++;
            } else {
              newCount++;
            }

            rowsToImport.push({ date: normalizedDate, balance: row.balance, existingDocId });
            months.add(format(normalizedDate, "MMMM yyyy", { locale: it }));
          }

          setPreviewData({
            accountId: values.accountId,
            accountName: account.name,
            totalRows: data.length,
            newCount,
            overwrittenCount,
            invalidCount,
            months: Array.from(months),
            rowsToImport,
          });
          setStep("preview");
        } catch (error) {
          console.error("Error generating preview:", error);
          toast({
            variant: "destructive",
            title: "Errore di analisi",
            description: "Impossibile analizzare i dati. Riprova.",
          });
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile leggere il file CSV.",
        });
        setLoading(false);
      },
    });
  };

  const handleConfirmImport = async () => {
    if (!previewData || !user) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      for (const row of previewData.rowsToImport) {
        const dataToSet = {
          userId: user.uid,
          accountId: previewData.accountId,
          date: Timestamp.fromDate(row.date),
          balance: row.balance,
        };

        const docRef = row.existingDocId
          ? doc(db, "balanceSnapshots", row.existingDocId)
          : doc(collection(db, "balanceSnapshots"));
        
        batch.set(docRef, dataToSet, { merge: true });
      }

      await batch.commit();
      toast({
        title: "Successo!",
        description: `${previewData.rowsToImport.length} saldi importati/aggiornati con successo.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Errore durante l'importazione:", error);
      toast({
        variant: "destructive",
        title: "Errore di importazione",
        description: "Impossibile salvare i dati. Riprova.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onOpenChange = (isOpen: boolean) => {
    if (loading && !isOpen) return; // Prevent closing while loading
    setOpen(isOpen);
    if (!isOpen) {
        // Reset state on close
        handleReset();
    }
  }

  const fileRef = form.register("file");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importa Saldi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Importa Saldi da CSV</DialogTitle>
              <DialogDescription>
                Carica un file CSV con la cronologia dei saldi per un conto. Il
                file deve contenere le colonne `date` (es. 2024-01-31) e `balance`.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onGeneratePreview)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={accounts.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                             <SelectValue>
                                {field.value ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 rounded-md">
                                            <AvatarImage src={accounts.find(a => a.id === field.value)?.iconUrl || undefined} />
                                            <AvatarFallback className="rounded-md bg-muted text-xs">
                                                <Landmark className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{accounts.find(a => a.id === field.value)?.name}</span>
                                    </div>
                                ) : (
                                    "Seleziona un conto di destinazione"
                                )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6 rounded-md">
                                        <AvatarImage src={acc.iconUrl || undefined} />
                                        <AvatarFallback className="rounded-md bg-muted text-xs">
                                            <Landmark className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{acc.name}</span>
                                </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>File CSV</FormLabel>
                      <FormControl>
                        <Input type="file" accept=".csv" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loading || accounts.length === 0}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Analisi in corso...</span>
                    </>
                  ) : (
                    "Analizza File"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
        {step === "preview" && previewData && (
          <>
            <DialogHeader>
              <DialogTitle>Anteprima Importazione</DialogTitle>
              <DialogDescription>
                Controlla i dati prima di importare i saldi per il conto{" "}
                <span className="font-semibold text-foreground">
                  {previewData.accountName}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <Alert variant="default">
                    <FileCheck2 className="h-4 w-4" />
                    <AlertTitle>Riepilogo File</AlertTitle>
                    <AlertDescription>
                        Trovate {previewData.totalRows} righe nel file CSV.
                    </AlertDescription>
                </Alert>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="bg-success/10 text-success p-2 rounded-md">
                            <FileCheck2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{previewData.newCount}</p>
                            <p className="text-muted-foreground">Nuovi saldi da creare</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="bg-blue-500/10 text-blue-500 p-2 rounded-md">
                            <CopyCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{previewData.overwrittenCount}</p>
                            <p className="text-muted-foreground">Saldi da sovrascrivere</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 rounded-lg border p-3 col-span-1 sm:col-span-2">
                        <div className="bg-destructive/10 text-destructive p-2 rounded-md">
                            <FileX2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{previewData.invalidCount}</p>
                            <p className="text-muted-foreground">Righe non valide ignorate</p>
                        </div>
                    </div>
                </div>

                 {previewData.months.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Mesi interessati:</h4>
                        <div className="flex flex-wrap gap-2">
                            {previewData.months.map(m => <Badge variant="secondary" key={m}>{m}</Badge>)}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Indietro
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={loading || previewData.rowsToImport.length === 0}
                className="mb-2 sm:mb-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Importazione...</span>
                  </>
                ) : (
                  `Importa ${previewData.rowsToImport.length} saldi`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
