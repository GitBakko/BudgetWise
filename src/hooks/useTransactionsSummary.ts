
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth, subYears, startOfDay, format, eachDayOfInterval, eachMonthOfInterval, getDaysInMonth } from "date-fns";
import { it } from "date-fns/locale";

export function useTransactionsSummary(timeframe: 'month' | 'year') {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number } | null>(null);
    const [chartData, setChartData] = useState<Array<{ date: string; Entrate: number; Spese: number }>>([]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setSummary(null);
        setChartData([]);

        const now = new Date();
        const startDate = timeframe === 'month' ? startOfMonth(now) : startOfMonth(subYears(now, 1));
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

            if(timeframe === 'month') {
                const dailyAggregates: { [key: string]: { income: number; expense: number } } = {};
                const intervalDays = eachDayOfInterval({ start: startDate, end: endOfMonth(now) });

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
                     .filter(item => item.dateObj <= endOfMonth(now))
                    .map(item => ({
                        date: format(item.dateObj, "d", { locale: it }),
                        Entrate: item.income,
                        Spese: item.expense
                    }));
                
                setChartData(sortedChartData);

            } else { // timeframe === 'year'
                const monthlyAggregates: { [key: string]: { income: number; expense: number } } = {};
                const intervalMonths = eachMonthOfInterval({ start: startDate, end: endDate });

                intervalMonths.forEach(month => {
                    const monthKey = format(month, "yyyy-MM");
                    monthlyAggregates[monthKey] = { income: 0, expense: 0 };
                });

                transactions.forEach(t => {
                    const monthKey = format(t.date.toDate(), "yyyy-MM");
                    if (monthlyAggregates[monthKey]) {
                         if (t.type === 'income') {
                            monthlyAggregates[monthKey].income += t.amount;
                        } else {
                            monthlyAggregates[monthKey].expense += t.amount;
                        }
                    }
                });

                const sortedChartData = Object.entries(monthlyAggregates)
                     .map(([month, values]) => ({
                        dateObj: new Date(month + '-01'),
                        income: parseFloat(values.income.toFixed(2)),
                        expense: parseFloat(values.expense.toFixed(2)),
                    }))
                    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                    .map(item => ({
                        date: format(item.dateObj, "MMM", { locale: it }),
                        Entrate: item.income,
                        Spese: item.expense
                    }));
                
                setChartData(sortedChartData);
            }

            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions summary:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, timeframe]);

    return { loading, summary, chartData };
}
