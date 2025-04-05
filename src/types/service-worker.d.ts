/**
 * Расширение типов для Service Worker API
 */

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
}

interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  clients: Clients;
  registration: ServiceWorkerRegistration;
  skipWaiting(): Promise<void>;
}

interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client>;
  matchAll(options?: ClientQueryOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient>;
}

interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: 'window' | 'worker' | 'sharedworker' | 'all';
}

interface Client {
  id: string;
  type: 'window' | 'worker' | 'sharedworker';
  url: string;
}

interface WindowClient extends Client {
  focused: boolean;
  visibilityState: 'hidden' | 'visible' | 'prerender' | 'unloaded';
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient>;
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  clientId: string;
  resultingClientId: string;
  isReload: boolean;
}

interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

interface PushEvent extends ExtendableEvent {
  data: PushMessageData;
}

interface PushMessageData {
  arrayBuffer(): ArrayBuffer;
  blob(): Blob;
  json(): unknown;
  text(): string;
}

interface NotificationEvent extends ExtendableEvent {
  action: string;
  notification: Notification;
}