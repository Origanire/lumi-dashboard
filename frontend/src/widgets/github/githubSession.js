const PREFIX = 'lumi_github_session_';
export function readGitHubToken(userId) {
  if (!userId) return '';
  try { return sessionStorage.getItem(PREFIX + userId) || ''; } catch { return ''; }
}
export function saveGitHubToken(userId, token) {
  if (!userId) throw new Error('Connectez-vous à Lumi avant de connecter GitHub.');
  if (token) sessionStorage.setItem(PREFIX + userId, token);
  else sessionStorage.removeItem(PREFIX + userId);
  window.dispatchEvent(new Event('lumi:github-session'));
}
export function clearGitHubSessions() {
  for (const key of Object.keys(sessionStorage)) if (key.startsWith(PREFIX)) sessionStorage.removeItem(key);
  window.dispatchEvent(new Event('lumi:github-session'));
}
