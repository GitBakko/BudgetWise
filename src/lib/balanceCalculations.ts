import type { Account, BalanceSnapshot, Transaction } from "@/types";
import { 
  startOfDay, 
  format, 
  isAfter,
  isBefore,
  differenceInDays,
  subDays,
  addDays,
  startOfMonth,
  addMonths,
  startOfQuarter,
  addQuarters,
  startOfYear,
  addYears
} from "date-fns";
import { it } from "date-fns/locale";
import type { ChartConfig } from "@/components/ui/chart";

const GROUPING_THRESHOLD = 0.02; // 2%
const MIN_ACCOUNTS_FOR_GROUPING = 3; // Apply grouping only if there are 3 or more accounts

/**
 * Determines the optimal time settings for a chart based on the date range.
 * @param oldestDate The earliest date in the dataset.
 * @param newestDate The latest date in the dataset.
 * @returns An object with start date, increment function, and format string/function.
 */
export const getChartTimeSettings = (oldestDate: Date, newestDate: Date) => {
    const daysDiff = differenceInDays(newestDate, oldestDate);

    if (daysDiff <= 60) { // Up to 2 months -> daily
        return {
            startDate: subDays(newestDate, Math.max(daysDiff, 29)), // Show at least 30 days
            increment: (d: Date) => addDays(d, 1),
            format: "d MMM"
        };
    } else if (daysDiff <= 365 * 1.5) { // Up to 1.5 years -> monthly
        return {
            startDate: startOfMonth(oldestDate),
            increment: (d: Date) => addMonths(d, 1),
            format: "MMM yy"
        };
    } else if (daysDiff <= 365 * 3) { // Up to 3 years -> quarterly
        return {
            startDate: startOfQuarter(oldestDate),
            increment: (d: Date) => addQuarters(d, 1),
            format: (d: Date) => `Q${Math.floor((d.getMonth() + 3) / 3)} '${format(d, 'yy')}`
        };
    } else { // More than 3 years -> yearly
        return {
            startDate: startOfYear(oldestDate),
            increment: (d: Date) => addYears(d, 1),
            format: "yyyy"
        };
    }
};

/**
 * Calculates the balance of a single account on a specific date.
 * @param account The account to calculate the balance for.
 * @param date The target date.
 * @param allTransactions All transactions for the user.
 * @param allSnapshots All snapshots for the user.
 * @returns The calculated balance.
 */
export const calculateBalanceOnDate = (
    account: Account, 
    date: Date, 
    allTransactions: Transaction[], 
    allSnapshots: BalanceSnapshot[]
) => {
    const targetDate = startOfDay(date);

    const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
    const accountSnapshots = allSnapshots
        .filter(s => s.accountId === account.id)
        .sort((a, b) => b.date.seconds - a.date.seconds); // Sort descending to find latest

    // Find the latest snapshot that is on or before the target date
    const referenceSnapshot = accountSnapshots.find(s => !isAfter(s.date.toDate(), targetDate));

    if (!referenceSnapshot) {
        // If no snapshot exists on or before the date, the balance is 0,
        // as the account is considered not to have existed from a balance perspective.
        return 0;
    }

    const referenceBalance = referenceSnapshot.balance;
    const referenceDate = startOfDay(referenceSnapshot.date.toDate());

    const balanceChange = accountTransactions
        .filter(t => {
            const transactionDate = startOfDay(t.date.toDate());
            // Sum transactions strictly AFTER the reference snapshot date, up to and including the target date
            return isAfter(transactionDate, referenceDate) && !isAfter(transactionDate, targetDate);
        })
        .reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    
    return referenceBalance + balanceChange;
};

/**
 * Calculates the current balance for all accounts combined.
 * @param allAccounts Array of all user accounts.
 * @param allTransactions Array of all user transactions.
 * @param allSnapshots Array of all user balance snapshots.
 * @returns The total current balance.
 */
export const calculateAllAccountsCurrentBalance = (
    allAccounts: Account[],
    allTransactions: Transaction[],
    allSnapshots: BalanceSnapshot[]
): number => {
    if (!allAccounts.length) return 0;
    
    const today = new Date();
    const totalBalance = allAccounts.reduce((sum, acc) => {
        return sum + calculateBalanceOnDate(acc, today, allTransactions, allSnapshots);
    }, 0);

    return totalBalance;
};

/**
 * Pre-calculates chart configuration and account groupings.
 */
export const precomputeChartConfigAndGrouping = (
    allAccounts: Account[],
    allTransactions: Transaction[],
    allSnapshots: BalanceSnapshot[]
) => {
    if (allAccounts.length === 0) {
        return { majorAccounts: [], minorAccounts: [], isGroupingActive: false, baseConfig: {} };
    }

    const today = startOfDay(new Date());

    const finalBalances = new Map<string, number>();
    allAccounts.forEach(acc => {
        const balance = calculateBalanceOnDate(acc, today, allTransactions, allSnapshots);
        finalBalances.set(acc.id, balance);
    });

    // Use absolute values for threshold calculation to handle negative balances correctly
    const totalFinalBalanceMagnitude = Array.from(finalBalances.values()).reduce((sum, b) => sum + Math.abs(b), 0);
    
    let majorAccounts: Account[] = [...allAccounts];
    let minorAccounts: Account[] = [];
    let isGroupingActive = false;

    if (allAccounts.length >= MIN_ACCOUNTS_FOR_GROUPING && totalFinalBalanceMagnitude > 0) {
        const thresholdAmount = totalFinalBalanceMagnitude * GROUPING_THRESHOLD;
        const tempMajor: Account[] = [];
        const tempMinor: Account[] = [];

        allAccounts.forEach(acc => {
            if (Math.abs(finalBalances.get(acc.id) ?? 0) < thresholdAmount) {
                tempMinor.push(acc);
            } else {
                tempMajor.push(acc);
            }
        });
        
        if (tempMinor.length > 1) { // Only group if there's more than one minor account
            isGroupingActive = true;
            majorAccounts = tempMajor;
            minorAccounts = tempMinor;
        }
    }

    const accountColors = [ "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))" ];
    
    const baseConfig: ChartConfig = { "Saldo Totale": { label: "Saldo Totale", color: "hsl(var(--primary))" } };
    majorAccounts.forEach((account, index) => {
        baseConfig[account.name] = { label: account.name, color: account.color || accountColors[index % accountColors.length] };
    });
    if (isGroupingActive) {
        baseConfig["Altri"] = { label: "Altri", color: "hsl(var(--muted-foreground))" };
    }

    return { majorAccounts, minorAccounts, isGroupingActive, baseConfig };
};

/**
 * Generates the complete dataset and configuration for the main balance chart.
 */
export const generateGlobalChartData = (
    allAccounts: Account[],
    allTransactions: Transaction[],
    allSnapshots: BalanceSnapshot[],
    groupingInfo: { majorAccounts: Account[], minorAccounts: Account[], isGroupingActive: boolean, baseConfig: ChartConfig },
    shouldExplode: boolean
) => {
    if (allAccounts.length === 0) {
        return { chartData: [], chartConfig: {} };
    }

    const { majorAccounts, minorAccounts, isGroupingActive, baseConfig } = groupingInfo;
    const today = startOfDay(new Date());
    const accountColors = [ "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))" ];

    let oldestDate = new Date();
    const relevantAccounts = shouldExplode ? minorAccounts : allAccounts;
    const relevantAccountIds = new Set(relevantAccounts.map(a => a.id));
    
    const relevantSnapshots = allSnapshots.filter(s => relevantAccountIds.has(s.accountId));
    
    if (relevantSnapshots.length > 0) {
        oldestDate = relevantSnapshots.reduce((oldest, s) => {
            const sDate = s.date.toDate();
            return isBefore(sDate, oldest) ? sDate : oldest;
        }, new Date());
    } else if (relevantAccounts.length > 0) {
        oldestDate = relevantAccounts.reduce((oldest, a) => {
            const aDate = a.createdAt.toDate();
            return isBefore(aDate, oldest) ? aDate : oldest;
        }, new Date());
    }

    
    const settings = getChartTimeSettings(startOfDay(oldestDate), today);
    const data = [];
    let currentDate = settings.startDate;

    if (shouldExplode) {
        const explodedConfig: ChartConfig = {};
        minorAccounts.forEach((account, index) => {
            explodedConfig[account.name] = { label: account.name, color: account.color || accountColors[index % accountColors.length] };
        });

        while (!isAfter(currentDate, today)) {
            const dayData: { [key: string]: any } = { date: typeof settings.format === 'function' ? settings.format(currentDate) : format(currentDate, settings.format, { locale: it }) };
            minorAccounts.forEach(acc => {
                const balance = calculateBalanceOnDate(acc, currentDate, allTransactions, allSnapshots);
                dayData[acc.name] = parseFloat(balance.toFixed(2));
            });
            data.push(dayData);
            currentDate = settings.increment(currentDate);
        }
        return { chartData: data, chartConfig: explodedConfig };

    } else {
        while (!isAfter(currentDate, today)) {
            const dayData: { [key: string]: any } = { date: typeof settings.format === 'function' ? settings.format(currentDate) : format(currentDate, settings.format, { locale: it }) };
            let totalDayBalance = 0;
            majorAccounts.forEach(acc => {
                const balance = calculateBalanceOnDate(acc, currentDate, allTransactions, allSnapshots);
                dayData[acc.name] = parseFloat(balance.toFixed(2));
                totalDayBalance += balance;
            });
            if (isGroupingActive) {
                let othersBalance = 0;
                minorAccounts.forEach(acc => {
                    othersBalance += calculateBalanceOnDate(acc, currentDate, allTransactions, allSnapshots);
                });
                dayData["Altri"] = parseFloat(othersBalance.toFixed(2));
                totalDayBalance += othersBalance;
            }
            dayData["Saldo Totale"] = parseFloat(totalDayBalance.toFixed(2));
            data.push(dayData);
            currentDate = settings.increment(currentDate);
        }
        return { chartData: data, chartConfig: baseConfig };
    }
};
