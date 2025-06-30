
"use client";

import { useState } from "react";
import Link from 'next/link';
import { useTransactionsTable } from "@/hooks/useTransactionsTable";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import DynamicIcon from "@/components/DynamicIcon";
import { MoreHorizontal, Edit, Trash2, Camera } from "lucide-react";

import { EditTransactionDialog } from "@/components/dashboard/EditTransactionDialog";
import { DeleteTransactionDialog } from "@/components/dashboard/DeleteTransactionDialog";
import type { Transaction } from "@/types";

export function TransactionsTable() {
  const {
    loading,
    filteredTransactions,
    accounts,
    categories,
    accountMap,
    categoryMap,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterAccount,
    setFilterAccount,
    filterCategory,
    setFilterCategory,
  } = useTransactionsTable();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center">
            <Input
              placeholder="Cerca per descrizione o note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:max-w-xs"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex-1">
                <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "income" | "expense")}>
                    <SelectTrigger><SelectValue placeholder="Filtra per tipo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti i Tipi</SelectItem>
                        <SelectItem value="income">Entrate</SelectItem>
                        <SelectItem value="expense">Spese</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger><SelectValue placeholder="Filtra per Conto" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti i Conti</SelectItem>
                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger><SelectValue placeholder="Filtra per Categoria" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutte le Categorie</SelectItem>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
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
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    const accountInfo = accountMap.get(transaction.accountId);
                    const categoryInfo = categoryMap.get(transaction.category);
                    return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                {transaction.receiptUrl && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                        <Link href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                                            <Camera className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                )}
                                <span>{transaction.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center gap-2">
                                {accountInfo?.color && <div className="h-2 w-2 rounded-full" style={{backgroundColor: accountInfo.color}} />}
                                <span>{accountInfo?.name || "Sconosciuto"}</span>
                              </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex w-fit items-center gap-1.5 p-1 pr-2.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-sm text-primary-foreground" style={{ backgroundColor: categoryInfo?.color || '#444444' }}>
                                <DynamicIcon name={categoryInfo?.icon || "HelpCircle"} className="h-3 w-3" />
                              </div>
                              <span className="capitalize">{transaction.category}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(transaction.date.seconds * 1000).toLocaleDateString("it-IT")}</TableCell>
                          <TableCell className={`text-right font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"}`}>
                            {transaction.type === "income" ? "+" : "-"}
                            €{transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onSelect={() => setEditingTransaction(transaction)}><Edit className="mr-2 h-4 w-4" /><span>Modifica</span></DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => setDeletingTransaction(transaction)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /><span>Elimina</span></DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    )
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nessuna transazione trovata.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}
        />
      )}

      {deletingTransaction && (
        <DeleteTransactionDialog
          transaction={deletingTransaction}
          open={!!deletingTransaction}
          onOpenChange={(isOpen) => !isOpen && setDeletingTransaction(null)}
        />
      )}
    </>
  );
}
