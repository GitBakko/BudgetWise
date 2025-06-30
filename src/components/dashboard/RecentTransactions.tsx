"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Landmark } from "lucide-react";
import { useRecentTransactions } from "@/hooks/useRecentTransactions";


export function RecentTransactions() {
  const { transactions, accounts, loading } = useRecentTransactions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transazioni Recenti</CardTitle>
          <CardDescription>
            I tuoi ultimi 5 movimenti finanziari.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/history">
                Mostra Tutto
                <ArrowRight className="h-4 w-4 ml-2"/>
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <Table>
            <TableBody>
              {transactions.map((transaction) => {
                const accountInfo = accounts.get(transaction.accountId);
                return (
                    <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {transaction.type === "income" ? (
                            <ArrowUpRight className="h-5 w-5" />
                            ) : (
                            <ArrowDownLeft className="h-5 w-5" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Landmark className="h-3 w-3" />
                            <div className="flex items-center gap-1.5">
                               {accountInfo?.color && <div className="h-2 w-2 rounded-full" style={{backgroundColor: accountInfo.color}} />}
                               <span>{accountInfo?.name || "Sconosciuto"}</span>
                            </div>
                            </div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div
                        className={`font-semibold ${
                            transaction.type === "income"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                        >
                        {transaction.type === "income" ? "+" : "-"}
                        €{transaction.amount.toFixed(2)}
                        </div>
                        <Badge variant="outline" className="mt-1 capitalize">{transaction.category}</Badge>
                    </TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
           <div className="text-center text-muted-foreground py-8">
            <p>Nessuna transazione ancora.</p>
            <p className="text-xs">Aggiungine una per iniziare!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
