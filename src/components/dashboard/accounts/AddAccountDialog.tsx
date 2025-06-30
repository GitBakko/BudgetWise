"use client";

import { useState, useEffect, useRef } from "react";
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
import { Image as ImageIcon, PlusCircle, Loader2, Upload, RotateCcw } from "lucide-react";
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
  const [aiIconUrl, setAiIconUrl] = useState<string>("");
  const [iconLoading, setIconLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Only generate icon if name is long enough and no custom image has been set
    if (debouncedAccountName && debouncedAccountName.length > 2) {
      const formIcon = form.getValues("iconUrl");
      if(formIcon && formIcon !== aiIconUrl) return;

      const generateIcon = async () => {
        setIconLoading(true);
        try {
          const url = await generateAccountIcon(debouncedAccountName);
          setAiIconUrl(url);
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
      setAiIconUrl("");
      setIconPreview("");
      form.setValue("iconUrl", "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAccountName]);

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

  const handleResetIcon = () => {
    setIconPreview(aiIconUrl);
    form.setValue("iconUrl", aiIconUrl);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  const handleOpenChange = (isOpen: boolean) => {
    if (loading && !isOpen) return;

    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ name: "", initialBalance: 0, iconUrl: "" });
      setIconPreview("");
      setAiIconUrl("");
      setIconLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            <div className="space-y-2">
              <FormLabel>Icona Conto</FormLabel>
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
                        Carica Immagine
                    </Button>
                    {iconPreview && aiIconUrl && iconPreview !== aiIconUrl && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleResetIcon}>
                            <RotateCcw className="mr-2 h-4 w-4"/>
                            Usa icona AI
                        </Button>
                    )}
                </div>
              </div>
               <p className="text-xs text-muted-foreground">
                L'icona viene generata automaticamente oppure puoi caricarne una tu.
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
