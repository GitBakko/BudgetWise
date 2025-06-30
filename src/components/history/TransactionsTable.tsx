
"use client";

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


export function TransactionsTable() {
  const {
    loading,
    filteredTransactions,
    accounts,
    categories,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
  } = useTransactionsTable();

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
              filteredTransactions.map((transaction) => {
                const accountInfo = accounts.get(transaction.accountId);
                const categoryInfo = categories.get(transaction.category);
                return (
                    <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                        {transaction.description}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           {accountInfo?.color && <div className="h-2 w-2 rounded-full" style={{backgroundColor: accountInfo.color}} />}
                           <span>{accountInfo?.name || "Sconosciuto"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {categoryInfo?.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryInfo.color }} />}
                        <Badge variant="outline" className="capitalize">
                          {transaction.category}
                        </Badge>
                      </div>
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
                )
                })
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
