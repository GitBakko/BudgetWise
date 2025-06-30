"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Camera, Upload, AlertTriangle } from "lucide-react";
import { uploadFile } from "@/services/storage";
import { ocrReceipt, type OcrReceiptOutput } from "@/ai/flows/receiptOcrFlow";
import Image from "next/image";

interface ScanReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (data: OcrReceiptOutput, imageUrl: string) => void;
}

type ScanState = "idle" | "requesting_permission" | "camera_active" | "processing" | "permission_denied";

export function ScanReceiptDialog({ open, onOpenChange, onScanComplete }: ScanReceiptDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [processingMessage, setProcessingMessage] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const reset = () => {
    cleanupStream();
    setScanState("idle");
    setImageSrc(null);
    setProcessingMessage("");
  };

  useEffect(() => {
    if (open && scanState === 'idle') {
      setScanState('requesting_permission');
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          setScanState('camera_active');
        } catch (error) {
          console.error('Error accessing camera:', error);
          setScanState('permission_denied');
        }
      };
      getCameraPermission();
    } else if (!open) {
      reset();
    }
  }, [open, scanState]);
  
  useEffect(() => {
    if (scanState === 'camera_active' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [scanState]);

  const processImage = async (blob: Blob) => {
    if (!user) return;
    setScanState('processing');

    const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const reader = new FileReader();

    reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
            setProcessingMessage("Caricamento immagine...");
            const receiptUrl = await uploadFile(file, `receipts/${user.uid}/${file.name}`);
            
            setProcessingMessage("Analisi AI in corso...");
            const ocrResult = await ocrReceipt({ receiptDataUri: dataUri });
            
            onScanComplete(ocrResult, receiptUrl);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Errore", description: "Impossibile processare lo scontrino." });
            reset();
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
    cleanupStream();
    canvas.toBlob(blob => {
        if (blob) {
            setImageSrc(URL.createObjectURL(blob));
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

  const renderContent = () => {
    switch (scanState) {
        case 'requesting_permission':
            return (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p>Accesso alla fotocamera...</p>
                </div>
            );
        case 'permission_denied':
            return (
                <div className="space-y-4 w-full">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Accesso Fotocamera Negato</AlertTitle>
                        <AlertDescription>Per favore, abilita i permessi della fotocamera nel tuo browser. In alternativa, puoi caricare un file.</AlertDescription>
                    </Alert>
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Carica un file
                    </Button>
                </div>
            );
        case 'camera_active':
            return (
                <div className="space-y-4 w-full">
                    <div className="relative">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <Button size="icon" className="rounded-full h-16 w-16" onClick={handleCapture}><Camera className="h-8 w-8"/></Button>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex-1 border-t"/>
                        <span className="text-xs text-muted-foreground">OPPURE</span>
                        <div className="flex-1 border-t"/>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Carica un file
                    </Button>
                </div>
            );
        case 'processing':
            return (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">{processingMessage}</p>
                    {imageSrc && <Image src={imageSrc} alt="Anteprima scontrino" width={100} height={100} className="rounded-md object-contain h-24" />}
                </div>
            );
        default:
            return (
                 <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p>Inizializzazione...</p>
                </div>
            );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(scanState !== 'processing') onOpenChange(isOpen) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scansiona Scontrino</DialogTitle>
          <DialogDescription>Inquadra lo scontrino o carica un'immagine. L'AI estrarrà i dati per te.</DialogDescription>
        </DialogHeader>
        <div className="min-h-[20rem] flex items-center justify-center">
            {renderContent()}
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </DialogContent>
    </Dialog>
  );
}
