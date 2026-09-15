import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    book: <><path d="M4 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM14 7a3 3 0 0 1 3-3h3v15h-3a3 3 0 0 0-3 2" /></>,
    pulse: <path d="M2 12h5l3-7 4 14 3-7h5" />,
    server: <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M12 6.5h5M12 17.5h5" /></>,
    layers: <><path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Lance un test pour vérifier la connexion au serveur.');
  const [connection, setConnection] = useState('idle');
  const [lastCheck, setLastCheck] = useState(null);

  async function testConnection() {
    setLoading(true);
    setMessage('Vérification de la connexion…');
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok' || typeof data.message !== 'string') throw new Error('Réponse inattendue');
      setConnection('success');
      setMessage(data.message);
    } catch {
      setConnection('error');
      setMessage('Le serveur ne répond pas. Vérifie que le backend est lancé, puis réessaie.');
    } finally {
      setLastCheck(new Date().toLocaleTimeString('fr-FR'));
      setLoading(false);
    }
  }

  const label = loading ? 'Vérification…' : connection === 'success' ? 'Connecté' : connection === 'error' ? 'Indisponible' : 'À vérifier';

  return (
    <div className="workspace">
      <a className="skip-link" href="#main">Aller au contenu</a>
      <aside className="sidebar">
        <a className="workspace-brand" href="/" aria-label="Dashboard, accueil"><span className="brand-symbol">d<span>↗</span></span><span>dashboard<span className="brand-caption">Espace de travail</span></span><span className="workspace-version">01</span></a>
        <div className="sidebar-section">ESPACE PERSONNEL</div>
        <nav aria-label="Navigation principale">
          <a className="nav-item active" href="#main" aria-current="page"><Icon name="grid" /> Vue d’ensemble <span className="nav-count">01</span></a>
          <a className="nav-item" href="/api/docs" target="_blank" rel="noreferrer"><Icon name="book" /> Documentation API <Icon name="arrow" size={14} /></a>
        </nav>
        <div className="sidebar-note"><Icon name="layers" /><p>Dashboard / 01.<br /><span>Ton espace évoluera avec tes services et tes widgets.</span></p></div>
        <div className="sidebar-bottom"><span className="environment-dot" /> Environnement local <span className="mono">v0.1</span></div>
      </aside>

      <div className="content-area">
        <header className="topbar"><div><span className="breadcrumb">Espace de travail</span><span className="breadcrumb-separator">/</span><span>Vue d’ensemble</span></div><span className="development-badge">Développement</span></header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading"><div className="page-icon"><Icon name="grid" size={26} /></div><p className="eyebrow">ESPACE DE TRAVAIL</p><h1>Vue d’ensemble<span>.</span></h1><p className="intro">Tes outils, dans un même espace.<br />Commence par vérifier la connexion au serveur.</p></div>
          <div className="section-heading"><h2>Infrastructure</h2><span className="mono">01 / PREMIÈRE ÉTAPE</span></div>
          <div className="infrastructure-grid">
            <section className="connection-panel" aria-labelledby="connection-title">
              <div className="panel-heading"><span className="icon-box"><Icon name="pulse" /></span><h3 id="connection-title">Connexion au serveur</h3><span className={`connection-badge ${loading ? 'pending' : connection}`}><span className="status-dot" />{label}</span></div>
              <p className="panel-description">Vérifie que ton espace communique avec l’API.</p>
              <div className="connection-flow"><div><span className="flow-marker">01</span><strong>Interface</strong><span>React · JavaScript</span></div><span className={`flow-line ${connection === 'success' && !loading ? 'connected' : ''}`} aria-hidden="true">→</span><div><span className="flow-marker">02</span><strong>Serveur</strong><span>Node.js · TypeScript</span></div></div>
              <div className={`response-box ${connection === 'error' ? 'error' : ''}`} role="status" aria-live="polite"><span className="response-label">{connection === 'success' && !loading ? 'RÉPONSE DU SERVEUR' : 'ÉTAT DE LA CONNEXION'}</span><p>{message}</p></div>
              <div className="panel-actions"><button onClick={testConnection} disabled={loading}><Icon name="pulse" size={16} />{loading ? 'Test en cours…' : 'Tester la connexion'}</button><span className="last-check">{lastCheck ? `Dernier test à ${lastCheck}` : 'Aucun test effectué'}</span></div>
            </section>
            <section className="api-panel" aria-labelledby="api-title"><div className="api-panel-top"><span className="icon-box"><Icon name="server" /></span><span className="mono">API / 01</span></div><h3 id="api-title">Documentation<br />API.</h3><p>Explore les endpoints et teste leurs réponses depuis la documentation interactive.</p><div className="endpoint"><span>GET</span><code>/api/health</code></div><a className="documentation-link" href="/api/docs" target="_blank" rel="noreferrer">Ouvrir Swagger UI <Icon name="arrow" size={17} /></a></section>
          </div>
          <section className="next-section" aria-labelledby="next-title"><div className="next-number mono">02</div><div><h2 id="next-title">Prochaines étapes</h2><p>Comptes utilisateurs, services et widgets personnalisables.</p></div><span className="planned-badge">À venir</span></section>
          <footer className="page-footer"><span>Dashboard · Projet G-WEB-500</span><span className="mono">REACT + TYPESCRIPT</span></footer>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
