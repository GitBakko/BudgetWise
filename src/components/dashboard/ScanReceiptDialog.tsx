
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Camera, Upload, AlertTriangle, RefreshCw } from "lucide-react";
import { uploadFile } from "@/services/storage";
import { ocrReceipt, type OcrReceiptOutput } from "@/ai/flows/receiptOcrFlow";
import Image from "next/image";

interface ScanReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (data: OcrReceiptOutput, imageUrl: string) => void;
}

export function ScanReceiptDialog({ open, onOpenChange, onScanComplete }: ScanReceiptDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    setHasCameraPermission(null);
    setImageSrc(null);
    setLoading(false);
  };
  
  useEffect(() => {
    if (!open) {
      cleanup();
    }
  }, [open]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!open || hasCameraPermission !== null) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
    
    return () => cleanup();
  }, [open, hasCameraPermission]);

  const processImage = async (blob: Blob) => {
    if (!user) return;
    setLoading(true);

    const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const reader = new FileReader();

    reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        
        try {
            setLoadingMessage("Caricamento immagine...");
            const receiptUrl = await uploadFile(file, `receipts/${user.uid}/${file.name}`);
            
            setLoadingMessage("Analisi AI in corso...");
            const ocrResult = await ocrReceipt({ receiptDataUri: dataUri });
            
            onScanComplete(ocrResult, receiptUrl);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Errore", description: "Impossibile processare lo scontrino." });
            setLoading(false);
        }
    };
    reader.readAsDataURL(file);
  }

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        if (blob) {
            setImageSrc(URL.createObjectURL(blob));
            cleanup(); // Stop camera after capture
            processImage(blob);
        }
    }, 'image/jpeg');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
      processImage(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scansiona Scontrino</DialogTitle>
          <DialogDescription>Inquadra lo scontrino o carica un'immagine. L'AI estrarrà i dati per te.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">{loadingMessage}</p>
                    {imageSrc && <Image src={imageSrc} alt="Anteprima scontrino" width={100} height={100} className="rounded-md object-contain h-24" />}
                </div>
            )}
            {!loading && (
                <>
                    {hasCameraPermission === null && (
                         <div className="flex flex-col items-center justify-center h-64 gap-4"><Loader2 className="h-10 w-10 animate-spin" /><p>Accesso alla fotocamera...</p></div>
                    )}
                    {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Accesso Fotocamera Negato</AlertTitle>
                            <AlertDescription>Per favore, abilita i permessi della fotocamera nel tuo browser. In alternativa, puoi caricare un file.</AlertDescription>
                        </Alert>
                    )}
                    {hasCameraPermission === true && (
                        <div className="relative">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <Button size="icon" className="rounded-full h-16 w-16" onClick={handleCapture}><Camera className="h-8 w-8"/></Button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 border-t"/>
                        <span className="text-xs text-muted-foreground">OPPURE</span>
                        <div className="flex-1 border-t"/>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Carica un file
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
