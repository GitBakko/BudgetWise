"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { generateAccountIcon } from "@/ai/flows/generateIconFlow";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Loader2, Upload, RefreshCw } from "lucide-react";


const accountSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  initialBalance: z.coerce
    .number()
    .min(0, { message: "Il saldo iniziale non può essere negativo." }),
  iconUrl: z.string().optional(),
});

type FormValues = z.infer<typeof accountSchema>;

interface EditAccountDialogProps {
    account: Account;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Helper function to generate a unique account name
const generateSuggestedName = (baseName: string, existingNames: string[]): string => {
    let suggestion = `${baseName} (2)`;
    let counter = 2;
    const lowerCaseNames = existingNames.map(n => n.toLowerCase());
    while (lowerCaseNames.includes(suggestion.toLowerCase())) {
        counter++;
        suggestion = `${baseName} (${counter})`;
    }
    return suggestion;
};

export function EditAccountDialog({ account, open, onOpenChange }: EditAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconPreview, setIconPreview] = useState<string | undefined>(account.iconUrl);
  const [iconLoading, setIconLoading] = useState<boolean>(false);
  
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    originalValues: FormValues;
    suggestedName: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account.name,
      initialBalance: account.initialBalance,
      iconUrl: account.iconUrl || "",
    },
  });
  
  useEffect(() => {
    if (open) {
      form.reset({
          name: account.name,
          initialBalance: account.initialBalance,
          iconUrl: account.iconUrl || "",
      });
      setIconPreview(account.iconUrl);
    }
  }, [account, form, open]);

  useEffect(() => {
    if (!user || !open) return;
    const fetchAccounts = async () => {
      const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const accountsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setUserAccounts(accountsData);
    };
    fetchAccounts();
  }, [user, open]);

  const handleRegenerateIcon = async () => {
    const name = form.getValues("name");
    if (!name || name.length < 3) {
      toast({
        title: "Nome troppo corto",
        description: "Inserisci un nome di almeno 3 caratteri per generare una nuova icona.",
        variant: "destructive",
      });
      return;
    }

    setIconLoading(true);
    try {
      const url = await generateAccountIcon(name);
      setIconPreview(url);
      form.setValue("iconUrl", url, { shouldDirty: true });
    } catch (error) {
      console.error("Failed to regenerate icon:", error);
      toast({
        title: "Errore",
        description: "Impossibile rigenerare l'icona.",
        variant: "destructive",
      });
    } finally {
      setIconLoading(false);
    }
  };

  const proceedWithSubmission = async (values: FormValues) => {
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
      setDuplicateInfo(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const otherAccountNames = userAccounts
        .filter(acc => acc.id !== account.id)
        .map(acc => acc.name.toLowerCase());

    if (otherAccountNames.includes(values.name.toLowerCase())) {
        const suggestedName = generateSuggestedName(values.name, userAccounts.map(a => a.name));
        setDuplicateInfo({ originalValues: values, suggestedName });
        return;
    }
    await proceedWithSubmission(values);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateInfo) return;
    const newValues = {
        ...duplicateInfo.originalValues,
        name: duplicateInfo.suggestedName,
    };
    form.setValue("name", duplicateInfo.suggestedName);
    proceedWithSubmission(newValues);
  }

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
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (loading && !isOpen) return;
        onOpenChange(isOpen);
        if (!isOpen) setDuplicateInfo(null);
    }}>
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
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <Avatar className="h-16 w-16 rounded-lg">
                           {iconLoading ? (
                                <Skeleton className="h-full w-full rounded-lg" />
                            ) : (
                                <>
                                    <AvatarImage src={iconPreview || undefined} alt={account.name} />
                                    <AvatarFallback className="rounded-lg">
                                        <Landmark className="h-8 w-8 text-muted-foreground" />
                                    </AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                            <Upload className="h-6 w-6"/>
                        </div>
                    </button>
                    <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Clicca sull'icona per cambiare l'immagine.
                        </p>
                         <Button type="button" variant="ghost" size="sm" onClick={handleRegenerateIcon} disabled={iconLoading || form.getValues('name').length < 3} className="text-xs h-auto py-1 px-2">
                            <RefreshCw className="mr-1.5 h-3 w-3"/>
                            {iconLoading ? 'Genero...' : 'Rigenera Icona AI'}
                        </Button>
                    </div>
                    <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
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
            <Button type="submit" disabled={loading || iconLoading} className="w-full">
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
     <AlertDialog open={!!duplicateInfo} onOpenChange={(isOpen) => !isOpen && setDuplicateInfo(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Nome Duplicato</AlertDialogTitle>
                <AlertDialogDescription>
                    Esiste già un conto chiamato <span className="font-semibold text-foreground">"{duplicateInfo?.originalValues.name}"</span>. 
                    Vuoi usare un nome suggerito o annullare?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDuplicateInfo(null)}>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDuplicate}>
                    Usa "{duplicateInfo?.suggestedName}"
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
