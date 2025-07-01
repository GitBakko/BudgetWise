
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@/types";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfMonth, endOfMonth, subMonths, subYears, startOfDay, format, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { it } from "date-fns/locale";

type Summary = {
    totalIncome: number;
    totalExpense: number;
    incomeChange: number | null;
    expenseChange: number | null;
}

type ChartData = {
    date: string;
    Entrate: number;
    Spese: number;
    "Entrate Prec."?: number;
    "Spese Prec."?: number;
}

const calculatePercentageChange = (current: number, previous: number): number | null => {
    if (previous === 0) {
        return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
};


export function useTransactionsSummary(timeframe: 'month' | 'year') {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setSummary(null);
        setChartData([]);

        const now = new Date();
        let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd, queryStartDate;

        if (timeframe === 'month') {
            currentPeriodStart = startOfMonth(now);
            currentPeriodEnd = now;
            previousPeriodStart = startOfMonth(subMonths(now, 1));
            previousPeriodEnd = endOfMonth(subMonths(now, 1));
            queryStartDate = previousPeriodStart;
        } else { // timeframe === 'year'
            currentPeriodStart = startOfMonth(subYears(now, 1));
            currentPeriodEnd = now;
            previousPeriodStart = startOfMonth(subYears(now, 2));
            previousPeriodEnd = endOfMonth(subYears(now, 1));
            queryStartDate = previousPeriodStart;
        }

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            where("date", ">=", Timestamp.fromDate(queryStartDate)),
            where("date", "<=", Timestamp.fromDate(currentPeriodEnd))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTransactions: Transaction[] = [];
            snapshot.forEach((doc) => {
                allTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
            });

            const currentTransactions = allTransactions.filter(t => {
                const d = t.date.toDate();
                return d >= currentPeriodStart && d <= currentPeriodEnd;
            });

            const previousTransactions = allTransactions.filter(t => {
                const d = t.date.toDate();
                return d >= previousPeriodStart && d <= previousPeriodEnd;
            });
            
            const currentTotals = currentTransactions.reduce((acc, t) => {
                if (t.type === 'income') acc.totalIncome += t.amount;
                else acc.totalExpense += t.amount;
                return acc;
            }, { totalIncome: 0, totalExpense: 0 });
            
            const previousTotals = previousTransactions.reduce((acc, t) => {
                if (t.type === 'income') acc.totalIncome += t.amount;
                else acc.totalExpense += t.amount;
                return acc;
            }, { totalIncome: 0, totalExpense: 0 });
            
            setSummary({
                ...currentTotals,
                incomeChange: calculatePercentageChange(currentTotals.totalIncome, previousTotals.totalIncome),
                expenseChange: calculatePercentageChange(currentTotals.totalExpense, previousTotals.totalExpense),
            });


            if(timeframe === 'month') {
                const dailyAggregates: { [key: string]: { income: number; expense: number } } = {};
                const intervalDays = eachDayOfInterval({ start: currentPeriodStart, end: endOfMonth(now) });

                intervalDays.forEach(day => {
                    dailyAggregates[format(day, "yyyy-MM-dd")] = { income: 0, expense: 0 };
                });

                currentTransactions.forEach(t => {
                    const dayKey = format(startOfDay(t.date.toDate()), "yyyy-MM-dd");
                    if (dailyAggregates[dayKey]) {
                        if (t.type === 'income') dailyAggregates[dayKey].income += t.amount;
                        else dailyAggregates[dayKey].expense += t.amount;
                    }
                });

                const finalChartData = Object.entries(dailyAggregates)
                    .map(([day, values]) => ({ dateObj: new Date(day), ...values }))
                    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                    .filter(item => item.dateObj <= endOfMonth(now))
                    .map(item => ({
                        date: format(item.dateObj, "d", { locale: it }),
                        Entrate: parseFloat(item.income.toFixed(2)),
                        Spese: parseFloat(item.expense.toFixed(2))
                    }));
                
                setChartData(finalChartData);

            } else { // timeframe === 'year'
                const aggregates: { [key: string]: { income: number; expense: number; prevIncome: number; prevExpense: number } } = {};
                const currentInterval = eachMonthOfInterval({ start: currentPeriodStart, end: currentPeriodEnd });

                currentInterval.forEach(month => {
                    aggregates[format(month, "yyyy-MM")] = { income: 0, expense: 0, prevIncome: 0, prevExpense: 0 };
                });

                currentTransactions.forEach(t => {
                    const monthKey = format(t.date.toDate(), "yyyy-MM");
                    if (aggregates[monthKey]) {
                         if (t.type === 'income') aggregates[monthKey].income += t.amount;
                         else aggregates[monthKey].expense += t.amount;
                    }
                });
                
                previousTransactions.forEach(t => {
                    const prevDate = t.date.toDate();
                    const correspondingCurrentDate = subYears(prevDate, -1); // Add a year to match current period
                    const monthKey = format(correspondingCurrentDate, "yyyy-MM");
                    if (aggregates[monthKey]) {
                         if (t.type === 'income') aggregates[monthKey].prevIncome += t.amount;
                         else aggregates[monthKey].prevExpense += t.amount;
                    }
                });

                const finalChartData = Object.entries(aggregates)
                     .map(([month, values]) => ({ dateObj: new Date(month + '-01'), ...values }))
                    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                    .map(item => ({
                        date: format(item.dateObj, "MMM", { locale: it }),
                        Entrate: parseFloat(item.income.toFixed(2)),
                        Spese: parseFloat(item.expense.toFixed(2)),
                        "Entrate Prec.": parseFloat(item.prevIncome.toFixed(2)),
                        "Spese Prec.": parseFloat(item.prevExpense.toFixed(2)),
                    }));
                
                setChartData(finalChartData);
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
