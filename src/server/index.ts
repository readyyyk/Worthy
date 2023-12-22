import { z } from 'zod';
import { publicProcedure, router } from '@/server/trpc';
import { balance, mockTransactions, primaryCurrency } from '@/assets/mockData';
import { SerializedTransaction, Transaction } from '@/types/transaction';
import { compareDesc, differenceInDays } from 'date-fns';
import { Data } from '@/types/chart';

export const appRouter = router({
    getAllTransactions: publicProcedure.query(async () => {
        return mockTransactions as SerializedTransaction[];
    }),
    getRecentTransactions: publicProcedure.query(async () => {
        return mockTransactions.slice(0, 3) as [
            SerializedTransaction,
            SerializedTransaction,
            SerializedTransaction,
        ];
    }),
    getBalance: publicProcedure.query(async () => {
        return { balance: balance, currency: primaryCurrency };
    }),
    getChartData: publicProcedure
        .input(z.object({ range: z.literal(14) }))
        .query(async ({ input }) => {
            return mockTransactions
                .filter(
                    (a) => differenceInDays(new Date(), a.date) <= input.range,
                )
                .reduce((acc, el): Data => {
                    const thisDate = acc.findIndex(
                        (val) => differenceInDays(val.date, el.date) === 0,
                    );
                    if (thisDate !== -1)
                        acc[thisDate].amount += el.isIncome
                            ? 0 //el.amount
                            : el.amount;
                    //-el.amount;
                    else acc = [...acc, { amount: el.amount, date: el.date }];
                    return acc;
                }, [] as Data)
                .sort((a, b) => compareDesc(a.date, b.date));
        }),
});
export type AppRouter = typeof appRouter;
