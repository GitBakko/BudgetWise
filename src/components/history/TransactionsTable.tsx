"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction, Account } from "@/types";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export function TransactionsTable() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const transQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const unsubTransactions = onSnapshot(
      transQuery,
      (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data(),
          } as Transaction);
        });
        
        transactionsData.sort((a, b) => b.date.seconds - a.date.seconds);

        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      }
    );

    const accQuery = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid)
    );
    const unsubAccounts = onSnapshot(accQuery, (snapshot) => {
      const accsMap = new Map<string, string>();
      snapshot.forEach((doc) => {
        const account = doc.data() as Omit<Account, 'id'>;
        accsMap.set(doc.id, account.name);
      });
      setAccounts(accsMap);
    });

    return () => {
      unsubTransactions();
      unsubAccounts();
    };
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) =>
        filterType === "all" ? true : t.type === filterType
      )
      .filter((t) =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [transactions, filterType, searchTerm]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Cerca per descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filterType}
            onValueChange={(value) =>
              setFilterType(value as "all" | "income" | "expense")
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Tipi</SelectItem>
              <SelectItem value="income">Entrate</SelectItem>
              <SelectItem value="expense">Spese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrizione</TableHead>
              <TableHead>Conto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Importo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    {accounts.get(transaction.accountId) || "Sconosciuto"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(
                      transaction.date.seconds * 1000
                    ).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      transaction.type === "income"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    €{transaction.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nessuna transazione trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
