import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
    }).format(amount);
