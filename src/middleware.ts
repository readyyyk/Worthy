import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware для Next.js
 * Обрабатывает аутентификацию и настройку HTTP-кеширования
 */
export async function middleware(request: NextRequest) {
  // Аутентификация
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  // Если пользователь не аутентифицирован и пытается получить доступ к защищенным маршрутам
  if (!isAuthenticated && isProtectedRoute(request.nextUrl.pathname)) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Получаем путь запроса
  const path = request.nextUrl.pathname;
  
  // Клонируем ответ для модификации
  const response = NextResponse.next();
  
  // Настройка кеширования для статических ресурсов
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Статические ресурсы кешируются на длительное время
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Настройка кеширования для API
  else if (path.startsWith('/api/trpc')) {
    if (isAuthenticated) {
      // Приватные данные не должны кешироваться общими кешами
      response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    } else {
      // Публичные API могут кешироваться, но с проверкой свежести
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
  }
  // Настройка кеширования для HTML страниц
  else if (!path.startsWith('/_next/')) {
    // HTML страницы не должны кешироваться браузером
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
  
  return response;
}

/**
 * Проверяет, является ли маршрут защищенным (требующим аутентификации)
 * @param path Путь запроса
 * @returns true, если маршрут защищен
 */
function isProtectedRoute(path: string): boolean {
  const protectedRoutes = [
    '/',
    '/transactions',
    '/new',
    '/me',
    '/templates',
    '/sessions',
  ];
  
  return protectedRoutes.some(route => path === route || path.startsWith(`${route}/`));
}

// Обновляем конфигурацию middleware
export const config = {
  matcher: [
    '/',
    '/transactions',
    '/new',
    '/me',
    '/templates',
    '/sessions',
    '/api/trpc/:path*',
    '/_next/static/:path*',
    '/static/:path*',
    '/:path*.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)',
  ],
};
