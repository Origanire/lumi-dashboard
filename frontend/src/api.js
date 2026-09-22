import { SESSION_TOKEN_KEY } from './config';

export default async function api(path, { body, ...options } = {}) {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      'Connexion au serveur impossible. Réessayez dans un instant.',
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.message || 'Le serveur ne peut pas traiter cette demande.',
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
