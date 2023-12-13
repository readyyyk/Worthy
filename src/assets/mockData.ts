import { type Data } from '@/types/chart';
import { type Transaction } from '@/types/transaction';

const r = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min);

export const primaryCurrency = 'BYN';

export const balance = 2000;

export const data: Data = [
    { date: new Date(), amount: r(0, 10) },
    {
        date: new Date(new Date().getTime() + 1000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 2000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 3000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 4000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 5000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 6000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 7000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 8000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 9000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 10000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 11000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 12000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 13000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 14000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 15000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 16000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 17000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 18000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 19000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 20000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 21000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 22000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 23000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 24000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 25000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 26000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 27000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 28000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 29000 * 60 * 60),
        amount: r(0, 10),
    },
    {
        date: new Date(new Date().getTime() + 30000 * 60 * 60),
        amount: r(0, 10),
    },
];

export const mockTransactions: Transaction[] = [
    {
        id: '1',
        description: 'Received Salary',
        amount: 1000,
        currency: 'BYN',
        isIncome: true,
        date: new Date('2022-05-01 20:51:20'),
        tags: ['Income', 'Work'],
    },
    {
        id: '2',
        description: 'Grocery Shopping at Local Mart',
        amount: 150,
        currency: 'BYN',
        isIncome: false,
        date: new Date('2022-05-02 12:20:20'),
        tags: ['Groceries', 'Shopping'],
    },
    {
        id: '3',
        description: 'Dinner at Italian Restaurant',
        amount: 200,
        currency: 'BYN',
        isIncome: false,
        date: new Date('2022-05-03 23:34:20'),
        tags: ['Dining Out', 'Entertainment'],
    },
    {
        id: '4',
        description: 'Freelance Web Development Project',
        amount: 300,
        currency: 'USD',
        isIncome: true,
        date: new Date('2022-05-04 15:20:20'),
        tags: ['Freelance', 'Income', 'Work'],
    },
    {
        id: '5',
        description: 'Investment in Stock Market',
        amount: 500,
        currency: 'BYN',
        isIncome: true,
        date: new Date('2022-01-01 09:56:20'),
        tags: ['Investment', 'Finance'],
    },
    {
        id: '6',
        description: 'Payment for Monthly Utilities',
        amount: 50,
        currency: 'EUR',
        isIncome: false,
        date: new Date('2022-09-01 17:37:20'),
        tags: ['Utilities', 'Bills'],
    },
];
