"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";

export function useUserAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const accs: Account[] = [];
            snapshot.forEach((doc) => accs.push({ id: doc.id, ...doc.data() } as Account));
            accs.sort((a, b) => a.name.localeCompare(b.name));
            setAccounts(accs);
        });
        return () => unsubscribe();
    }, [user]);

    return accounts;
}
