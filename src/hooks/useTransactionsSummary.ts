"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth, subYears, startOfDay, format, eachDayOfInterval } from "date-fns";
import { it } from "date-fns/locale";

export function useTransactionsSummary(timeframe: 'month' | 'year') {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
    const [chartData, setChartData] = useState<Array<{ date: string; Entrate: number; Spese: number }>>([]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const now = new Date();
        const startDate = timeframe === 'month' ? startOfMonth(now) : subYears(now, 1);
        const endDate = now;

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transactions: Transaction[] = [];
            snapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() } as Transaction);
            });

            const totals = transactions.reduce((acc, t) => {
                if (t.type === 'income') {
                    acc.totalIncome += t.amount;
                } else {
                    acc.totalExpense += t.amount;
                }
                return acc;
            }, { totalIncome: 0, totalExpense: 0 });
            setSummary(totals);

            const dailyAggregates: { [key: string]: { income: number; expense: number } } = {};
            
            const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
            intervalDays.forEach(day => {
                const dayKey = format(day, "yyyy-MM-dd");
                dailyAggregates[dayKey] = { income: 0, expense: 0 };
            });

            transactions.forEach(t => {
                const dayKey = format(startOfDay(t.date.toDate()), "yyyy-MM-dd");
                if (dailyAggregates[dayKey]) {
                     if (t.type === 'income') {
                        dailyAggregates[dayKey].income += t.amount;
                    } else {
                        dailyAggregates[dayKey].expense += t.amount;
                    }
                }
            });

            const sortedChartData = Object.entries(dailyAggregates)
                .map(([day, values]) => ({
                    dateObj: new Date(day),
                    income: parseFloat(values.income.toFixed(2)),
                    expense: parseFloat(values.expense.toFixed(2)),
                }))
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                .map(item => ({
                    date: format(item.dateObj, timeframe === 'month' ? "d" : "d MMM", { locale: it }),
                    Entrate: item.income,
                    Spese: item.expense
                }));

            setChartData(sortedChartData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions summary:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, timeframe]);

    return { loading, summary, chartData };
}
