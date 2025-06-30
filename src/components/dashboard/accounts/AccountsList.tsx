"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Account } from "@/types";
import { collection, query, where, onSnapshot, writeBatch, getDocs, doc, deleteDoc, type Firestore, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, MoreHorizontal, Edit, BookUp, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EditAccountDialog } from "./EditAccountDialog";
import { SetBalanceDialog } from "./SetBalanceDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { useToast } from "@/hooks/use-toast";

export function AccountsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [settingBalanceAccount, setSettingBalanceAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const accountsData: Account[] = [];
        querySnapshot.forEach((doc) => {
          accountsData.push({ id: doc.id, ...doc.data() } as Account);
        });
        // Sort on the client to avoid needing a composite index
        accountsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        setAccounts(accountsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching accounts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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


  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista Conti</CardTitle>
          <CardDescription>
            Elenco di tutti i tuoi conti registrati.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Conto</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead className="text-right">Saldo Iniziale</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="rounded-lg">
                          <AvatarImage src={account.iconUrl || undefined} alt={account.name} />
                          <AvatarFallback className="rounded-lg">
                              <Landmark className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(account.createdAt.seconds * 1000).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      €{account.initialBalance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Apri menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setEditingAccount(account)}>
                                <Edit className="mr-2 h-4 w-4"/>
                                <span>Modifica Conto</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setSettingBalanceAccount(account)}>
                                <BookUp className="mr-2 h-4 w-4" />
                                <span>Imposta Saldo a Data</span>
                              </DropdownMenuItem>
                               <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setDeletingAccount(account)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                <span>Elimina Conto</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Nessun conto trovato. Aggiungine uno per iniziare!
            </p>
          )}
        </CardContent>
      </Card>
      
      {editingAccount && (
        <EditAccountDialog 
          account={editingAccount} 
          open={!!editingAccount} 
          onOpenChange={(isOpen) => !isOpen && setEditingAccount(null)} 
        />
      )}

      {settingBalanceAccount && (
        <SetBalanceDialog 
          account={settingBalanceAccount} 
          open={!!settingBalanceAccount} 
          onOpenChange={(isOpen) => !isOpen && setSettingBalanceAccount(null)}
        />
      )}

      {deletingAccount && (
        <DeleteAccountDialog 
          account={deletingAccount}
          open={!!deletingAccount}
          onOpenChange={(isOpen) => !isOpen && setDeletingAccount(null)}
          onConfirm={() => handleDeleteAccount(deletingAccount.id)}
        />
      )}
    </>
  );
}
