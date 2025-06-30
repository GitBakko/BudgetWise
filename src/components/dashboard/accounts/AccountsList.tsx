"use client";

import React, { Fragment } from "react";
import Link from "next/link";
import { useAccountsList } from "@/hooks/useAccountsList";
import type { Account } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, MoreHorizontal, Edit, BookCopy, Trash2, ChevronDown, Search, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EditAccountDialog } from "./EditAccountDialog";
import { SetBalanceDialog } from "./SetBalanceDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { AccountTrendChart } from "./AccountTrendChart";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface AccountsListProps {
  onImportClick: (account: Account) => void;
}

export function AccountsList({ onImportClick }: AccountsListProps) {
  const {
    loading,
    filteredAccounts,
    accounts,
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
  } = useAccountsList();

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista Conti</CardTitle>
              <CardDescription>
                Elenco di tutti i tuoi conti registrati.
              </CardDescription>
            </div>

            {isSearchVisible ? (
                <div className="relative w-full animate-in fade-in slide-in-from-right-4 sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Cerca conto..."
                        className="pl-9 sm:w-48"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={handleSearchBlur}
                    />
                </div>
            ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsSearchVisible(true)} className="self-end sm:self-center">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Cerca Conto</span>
                </Button>
            )}
        </CardHeader>
        <CardContent className="pt-0">
          {accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Conto</TableHead>
                  <TableHead>Data Saldo Iniziale</TableHead>
                  <TableHead className="text-right">Saldo Iniziale</TableHead>
                  <TableHead className="w-[50px] text-center"></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? filteredAccounts.map((account) => (
                  <Fragment key={account.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="rounded-md h-10 w-10">
                            <AvatarImage src={account.iconUrl || undefined} alt={account.name} className="object-cover"/>
                            <AvatarFallback className="rounded-md bg-muted">
                                <Landmark className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                             {account.color && <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: account.color }} />}
                            <span className="font-medium">{account.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date((account.balanceStartDate || account.createdAt).seconds * 1000).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{account.initialBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleExpand(account.id)}>
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expandedAccountId === account.id && "rotate-180")}/>
                            <span className="sr-only">Mostra/Nascondi grafico</span>
                        </Button>
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
                                  <BookCopy className="mr-2 h-4 w-4" />
                                  <span>Imposta Saldo a Data</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/balances/${account.id}`}>
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    <span>Gestisci Saldi Storici</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onImportClick(account)}>
                                  <Upload className="mr-2 h-4 w-4"/>
                                  <span>Importa Saldi</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setDeletingAccount(account)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4"/>
                                  <span>Elimina Conto</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                     {expandedAccountId === account.id && (
                        <TableRow className="bg-muted/50 hover:bg-muted/50 animate-in fade-in-50">
                            <TableCell colSpan={5} className="p-2 md:p-4">
                                <AccountTrendChart account={account} />
                            </TableCell>
                        </TableRow>
                    )}
                  </Fragment>
                )) : (
                   <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nessun conto trovato per "{searchTerm}".
                      </TableCell>
                    </TableRow>
                )}
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
