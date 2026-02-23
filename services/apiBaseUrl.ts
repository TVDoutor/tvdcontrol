/**
 * Obtém a URL base da API a partir das variáveis de ambiente.
 * Retorna undefined se não estiver configurado em produção.
 */
export function getApiBaseUrl(): string | undefined {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === 'string' && configured.trim()) return configured.trim();

  // Fallback em dev: tenta portas comuns do backend
  if (import.meta.env.DEV) {
    if (import.meta.env.VITE_DEV_USE_LOCAL_BACKEND === 'true') {
      return 'http://localhost:8080';
    }
    return 'http://localhost:8081';
  }
  return undefined;
}

