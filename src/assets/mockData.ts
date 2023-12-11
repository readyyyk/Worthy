import { type Data } from '@/types/chart';
import { type Transaction } from '@/types/transaction';

const r = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min);

export const data: Data = [
    {
        id: 1,
        data: [
            { x: new Date(), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 1), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 2), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 3), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 4), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 5), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 6), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 7), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 8), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 9), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 10), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 11), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 12), y: r(0, 10) },
            { x: new Date(new Date().getTime() + 13), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 14), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 15), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 16), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 17), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 18), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 19), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 20), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 21), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 22), y: r(0, 10) },
            // { x: new Date(new Date().getTime() + 23), y: r(0, 10) },
        ],
    },
];

export const mockTransactions: Transaction[] = [
    {
        id: '1',
        description: 'Received Salary',
        amount: 1000,
        isIncome: true,
        date: '2022-05-01',
        tags: ['Income', 'Work'],
    },
    {
        id: '2',
        description: 'Grocery Shopping at Local Mart',
        amount: 150,
        isIncome: false,
        date: '2022-05-02',
        tags: ['Groceries', 'Shopping'],
    },
    {
        id: '3',
        description: 'Dinner at Italian Restaurant',
        amount: 200,
        isIncome: false,
        date: '2022-05-03',
        tags: ['Dining Out', 'Entertainment'],
    },
    {
        id: '4',
        description: 'Freelance Web Development Project',
        amount: 300,
        isIncome: true,
        date: '2022-05-04',
        tags: ['Freelance', 'Income', 'Work'],
    },
    {
        id: '5',
        description: 'Investment in Stock Market',
        amount: 500,
        isIncome: true,
        date: '2022-05-01',
        tags: ['Investment', 'Finance'],
    },
    {
        id: '6',
        description: 'Payment for Monthly Utilities',
        amount: 50,
        isIncome: false,
        date: '2022-05-06',
        tags: ['Utilities', 'Bills'],
    },
];
