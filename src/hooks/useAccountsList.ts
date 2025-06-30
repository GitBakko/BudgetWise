"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Account, BalanceSnapshot } from "@/types";
import { collection, query, where, onSnapshot, writeBatch, getDocs, doc, deleteDoc, type Firestore, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useAccountsList() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [settingBalanceAccount, setSettingBalanceAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleToggleExpand = (accountId: string) => {
        setExpandedAccountId(prevId => (prevId === accountId ? null : accountId));
    };

    useEffect(() => {
        if (isSearchVisible) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isSearchVisible]);

    const handleSearchBlur = () => {
        if (!searchTerm) {
            setIsSearchVisible(false);
        }
    }

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const accountsQuery = query(
            collection(db, "accounts"),
            where("userId", "==", user.uid)
        );
        const snapshotsQuery = query(
            collection(db, "balanceSnapshots"),
            where("userId", "==", user.uid)
        );

        const unsubAccounts = onSnapshot(
            accountsQuery,
            (querySnapshot) => {
                const accountsData: Account[] = [];
                querySnapshot.forEach((doc) => {
                    accountsData.push({ id: doc.id, ...doc.data() } as Account);
                });
                accountsData.sort((a, b) => a.name.localeCompare(b.name));
                setAccounts(accountsData);
                if (loading) setLoading(false);
            },
            (error) => {
                console.error("Error fetching accounts:", error);
                setLoading(false);
            }
        );

        const unsubSnapshots = onSnapshot(
            snapshotsQuery,
            (querySnapshot) => {
                const snapshotsData: BalanceSnapshot[] = [];
                querySnapshot.forEach((doc) => {
                    snapshotsData.push({ id: doc.id, ...doc.data() } as BalanceSnapshot);
                });
                setSnapshots(snapshotsData);
            },
            (error) => {
                console.error("Error fetching snapshots:", error);
            }
        );


        return () => {
            unsubAccounts();
            unsubSnapshots();
        }
    }, [user]);

    const accountsWithComputedData = useMemo(() => {
        const enrichedAccounts = accounts.map(account => {
            const accountSnaps = snapshots
                .filter(s => s.accountId === account.id)
                .sort((a, b) => b.date.seconds - a.date.seconds); // Descending sort for latest first
            
            const latestSnapshot = accountSnaps[0];
            
            return {
                ...account,
                snapshotCount: accountSnaps.length,
                lastBalance: latestSnapshot?.balance,
                lastBalanceDate: latestSnapshot?.date,
            };
        });
        
        if (!searchTerm) return enrichedAccounts;
        return enrichedAccounts.filter(account =>
            account.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [accounts, snapshots, searchTerm]);


    const handleDeleteAccount = async (accountId: string) => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Errore",
                description: "Devi essere loggato per eliminare un conto."
            });
            return;
        }
        try {
            const deleteQueryBatch = async (db_instance: Firestore, q: Query) => {
                const snapshot = await getDocs(q);
                
                const batchSize = 499;
                let i = 0;
                while (i < snapshot.size) {
                    const batch = writeBatch(db_instance);
                    snapshot.docs.slice(i, i + batchSize).forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    i += batchSize;
                }
            };

            const transQuery = query(collection(db, "transactions"), where("accountId", "==", accountId), where("userId", "==", user.uid));
            await deleteQueryBatch(db, transQuery);

            const snapQuery = query(collection(db, "balanceSnapshots"), where("accountId", "==", accountId), where("userId", "==", user.uid));
            await deleteQueryBatch(db, snapQuery);

            const accountRef = doc(db, "accounts", accountId);
            await deleteDoc(accountRef);

            toast({
                title: "Successo!",
                description: "Conto e tutti i dati associati eliminati con successo."
            })
        } catch (error) {
            console.error("Error deleting account:", error);
            toast({
                variant: "destructive",
                title: "Errore",
                description: "Impossibile eliminare il conto. Riprova. Potrebbe essere necessario creare un indice in Firestore (controlla la console per il link)."
            });
        } finally {
            setDeletingAccount(null);
        }
    };

    return {
        loading,
        accountsWithComputedData,
        searchTerm,
        setSearchTerm,
        isSearchVisible,
        setIsSearchVisible,
        searchInputRef,
        handleSearchBlur,
        expandedAccountId,
        handleToggleExpand,
        editingAccount,
        setEditingAccount,
        settingBalanceAccount,
        setSettingBalanceAccount,
        deletingAccount,
        setDeletingAccount,
        handleDeleteAccount,
    };
}
