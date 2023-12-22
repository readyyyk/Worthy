import { type Data } from '@/types/chart';
import { type Transaction } from '@/types/transaction';
import { addHours, compareAsc, compareDesc } from 'date-fns';

const r = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min);

export const primaryCurrency = 'BYN';

export const balance = 2000;

export const mockTransactions: Transaction[] = [
    {
        id: 1,
        ownerId: 1,
        description: 'Received Salary',
        amount: 1000,
        currency: 'BYN',
        isIncome: true,
        date: new Date('2022-05-01 20:51:20'),
        tags: ['Income', 'Work'],
    },
    {
        id: 2,
        ownerId: 1,
        description: 'Grocery Shopping at Local Mart',
        amount: 150,
        currency: 'BYN',
        isIncome: false,
        date: new Date('2022-05-02 12:20:20'),
        tags: ['Groceries', 'Shopping'],
    },
    {
        id: 3,
        ownerId: 1,
        description: 'Dinner at Italian Restaurant',
        amount: 200,
        currency: 'BYN',
        isIncome: false,
        date: new Date('2022-05-03 23:34:20'),
        tags: ['Dining Out', 'Entertainment'],
    },
    {
        id: 4,
        ownerId: 1,
        description: 'Freelance Web Development Project',
        amount: 300,
        currency: 'USD',
        isIncome: true,
        date: new Date('2022-05-04 15:20:20'),
        tags: ['Freelance', 'Income', 'Work'],
    },
    {
        id: 5,
        ownerId: 1,
        description: 'Investment in Stock Market',
        amount: 500,
        currency: 'BYN',
        isIncome: true,
        date: new Date('2022-01-01 09:56:20'),
        tags: ['Investment', 'Finance'],
    },
    {
        id: 6,
        ownerId: 1,
        description: 'Payment for Monthly Utilities',
        amount: 50,
        currency: 'EUR',
        isIncome: false,
        date: new Date('2022-09-01 17:37:20'),
        tags: ['Utilities', 'Bills'],
    },
    {
        id: 7,
        ownerId: 1,
        description: 'Payment for Monthly Utilities',
        amount: 28,
        currency: 'BYN',
        isIncome: false,
        date: new Date(),
        tags: ['monthly'],
    },
    {
        id: 8,
        ownerId: 1,
        description: 'Tutoring',
        amount: 30,
        currency: 'BYN',
        isIncome: true,
        date: addHours(new Date(), -2),
        tags: ['work'],
    },
    {
        id: 8,
        ownerId: 1,
        description: 'Vocations',
        amount: 400,
        currency: 'BYN',
        isIncome: false,
        date: addHours(new Date(), -8),
        tags: ['rest'],
    },
].sort((a, b) => compareDesc(a.date, b.date));
