import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Clique sur le bouton pour tester la connexion.');
  const [error, setError] = useState(false);

  async function testConnection() {
    setLoading(true);
    setError(false);
    setMessage('Connexion en cours…');
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok' || typeof data.message !== 'string') {
        throw new Error('Réponse inattendue');
      }
      setMessage(data.message);
    } catch {
      setError(true);
      setMessage('Impossible de joindre le backend. Vérifie que les deux serveurs sont lancés, puis réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <p className="eyebrow">Dashboard · Première étape</p>
      <h1>Connexion au backend</h1>
      <p>Le frontend React interroge notre API TypeScript.</p>
      <button onClick={testConnection} disabled={loading}>
        {loading ? 'Connexion en cours…' : 'Tester la connexion'}
      </button>
      <p role="status" aria-live="polite" className={error ? 'error' : 'status'}>{message}</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
