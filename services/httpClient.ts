export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpClientOptions = {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
};

const TOKEN_STORAGE_KEY = 'tvdcontrol.auth.token';
const TOKEN_UPDATED_EVENT = 'tvdcontrol.auth.token.updated';
const refreshLocks = new Map<string, Promise<boolean>>();
const refreshCooldownUntil = new Map<string, number>();
const REFRESH_COOLDOWN_MS = 2000;

export class HttpError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

export type HttpErrorContext = 'login' | 'register' | 'general';

function extractServerMessage(bodyText: string | undefined): string | null {
  const raw = typeof bodyText === 'string' ? bodyText.trim() : '';
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
    const msg = typeof parsed?.error === 'string' ? parsed.error : typeof parsed?.message === 'string' ? parsed.message : null;
    return msg && msg.trim() ? msg.trim() : null;
  } catch {
    return raw;
  }
}

export function getFriendlyErrorMessage(error: unknown, context: HttpErrorContext = 'general'): string {
  if (error instanceof HttpError) {
    if (context === 'login' && error.status === 401) return 'Usuário ou senha invalido';
    if (context === 'register' && error.status === 409) return 'Email já cadastrado';

    if (error.status === 403) return 'Sem permissão';
    if (error.status === 404) return 'Recurso não encontrado';
    if (error.status >= 500) return 'Erro interno do servidor';

    const serverMessage = extractServerMessage(error.bodyText);
    if (serverMessage) return serverMessage;

    if (error.status >= 400) return 'Não foi possível completar a solicitação';
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Erro inesperado';
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '';
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    return this.requestInternal<T>(method, path, body, false);
  }

  private shouldAttemptRefresh(path: string): boolean {
    if (path === '/auth/login') return false;
    if (path === '/auth/register') return false;
    if (path === '/auth/refresh') return false;
    if (path === '/auth/logout') return false;
    if (path === '/health') return false;
    return true;
  }

  private dispatchTokenUpdated(token: string | null) {
    try {
      window.dispatchEvent(new CustomEvent(TOKEN_UPDATED_EVENT, { detail: token }));
    } catch {
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.baseUrl) return false;
    const lockKey = this.baseUrl;
    const existing = refreshLocks.get(lockKey);
    if (existing) return existing;
    const now = Date.now();
    const cooldownUntil = refreshCooldownUntil.get(lockKey) ?? 0;
    if (now < cooldownUntil) return false;

    const inFlight = (async (): Promise<boolean> => {
      const url = this.buildUrl('/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as { token?: unknown } | null;
      const nextToken = data?.token;
      if (typeof nextToken !== 'string' || !nextToken.trim()) return false;
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      } catch {
      }
      this.dispatchTokenUpdated(nextToken);
      return true;
    })()
      .then((ok) => {
        if (ok) refreshCooldownUntil.delete(lockKey);
        else refreshCooldownUntil.set(lockKey, Date.now() + REFRESH_COOLDOWN_MS);
        return ok;
      })
      .finally(() => {
      refreshLocks.delete(lockKey);
    });

    refreshLocks.set(lockKey, inFlight);
    return inFlight;
  }

  private buildUrl(path: string): string {
    if (!this.baseUrl) return path;
    if (path.startsWith('/')) {
      return this.baseUrl.replace(/\/$/, '') + path;
    }
    return new URL(path, this.baseUrl).toString();
  }

  private async requestInternal<T>(method: HttpMethod, path: string, body: unknown, didRefresh: boolean): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = { ...this.defaultHeaders };

    // Adiciona o token JWT quando disponível
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignora erros ao ler do localStorage
    }

    let fetchBody: BodyInit | undefined = undefined;
    if (body !== undefined) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      fetchBody = JSON.stringify(body);
    }

    const res = await fetch(url, { method, headers, body: fetchBody, credentials: 'include' });
    if (res.status === 401 && !didRefresh && this.shouldAttemptRefresh(path)) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.requestInternal<T>(method, path, body, true);
      }
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
      }
      this.dispatchTokenUpdated(null);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => undefined);
      throw new HttpError(`HTTP ${res.status} (${method} ${path})`, res.status, text);
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    // Fallback: allow text payloads
    return (await res.text()) as unknown as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}


