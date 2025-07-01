
"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionDialog } from "./AddTransactionDialog";

export function FloatingAddButton() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        } else {
            setIsDialogOpen(true);
        }
    };

    // When dialog closes, also collapse the button.
    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setIsExpanded(false);
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Ignore clicks on the dialog content
            if (document.querySelector('[role="dialog"]')?.contains(event.target as Node)) {
                return;
            }
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleClick}
                className={cn(
                    "fixed bottom-6 right-6 z-40 flex items-center text-white font-semibold shadow-2xl transition-all duration-300 ease-in-out rounded-full group",
                    "bg-gradient-to-br from-[hsl(var(--ai-gradient-from))] to-[hsl(var(--ai-gradient-to))] hover:opacity-90",
                    isExpanded ? "w-60 h-16 pl-4 pr-6 gap-2" : "w-16 h-16 justify-center"
                )}
                aria-label={isExpanded ? "Apri modale per aggiungere transazione" : "Espandi per aggiungere transazione"}
                aria-expanded={isExpanded}
            >
                <Plus className={cn("h-7 w-7 transition-transform duration-300", isExpanded && "-rotate-45")} />
                <span
                    className={cn(
                        "transition-all duration-200 overflow-hidden whitespace-nowrap",
                        isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0"
                    )}
                >
                    Aggiungi Transazione
                </span>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-white/70 group-hover:animate-pulse" />
            </button>

            <AddTransactionDialog open={isDialogOpen} onOpenChange={handleDialogChange} />
        </>
    );
}
