import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    external: <><path d="M7 17 17 7M7 7h10v10" /></>,
    pulse: <path d="M2 12h5l3-7 4 14 3-7h5" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <a className="brand" href="/"><span className="brand-mark">L</span><span>LUMI</span></a>
        <div className="dashboard-account"><span>{user.name}</span><button className="logout-button" onClick={onLogout}>Se déconnecter</button></div>
      </header>
      <main className="dashboard-main">
        <p className="section-label"><span>01</span> Espace personnel</p>
        <h1>Bonjour,<br /><em>{user.name}.</em></h1>
        <div className="empty-dashboard">
          <Icon name="grid" size={30} />
          <div><h2>Votre dashboard est prêt.</h2><p>Les services et widgets personnalisables arriveront à la prochaine étape.</p></div>
          <span>0 widget</span>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Prêt pour le premier échange.');
  const [connection, setConnection] = useState('idle');
  const [lastCheck, setLastCheck] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('lumi_token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setUser)
      .catch(() => sessionStorage.removeItem('lumi_token'));
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Connexion impossible.');
      sessionStorage.setItem('lumi_token', data.token);
      setUser(data.user);
      setLoginOpen(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    const token = sessionStorage.getItem('lumi_token');
    if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    sessionStorage.removeItem('lumi_token');
    setUser(null);
  }

  async function testConnection() {
    setLoading(true);
    setMessage('Connexion au serveur Rust…');
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok' || typeof data.message !== 'string') throw new Error('Réponse inattendue');
      setConnection('success');
      setMessage(data.message);
    } catch {
      setConnection('error');
      setMessage('Le serveur ne répond pas. Vérifie que le backend est lancé.');
    } finally {
      setLastCheck(new Date().toLocaleTimeString('fr-FR'));
      setLoading(false);
    }
  }

  const statusLabel = loading ? 'Connexion…' : connection === 'success' ? 'En ligne' : connection === 'error' ? 'Hors ligne' : 'En attente';

  if (user) return <Dashboard user={user} onLogout={handleLogout} />;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Aller au contenu</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Lumi, accueil"><span className="brand-mark">L</span><span>LUMI</span></a>
        <nav aria-label="Navigation principale">
          <a href="#connection">Connexion</a>
          <a href="#architecture">Architecture</a>
          <a href="/api/docs" target="_blank" rel="noreferrer">API <Icon name="external" size={13} /></a>
        </nav>
        <button className="login-trigger" onClick={() => setLoginOpen(true)}>Se connecter</button>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="hero-copy reveal">
            <p className="section-label"><span>01</span> Votre espace numérique</p>
            <h1>Tout ce qui compte.<br /><em>Enfin réuni.</em></h1>
            <p className="hero-intro">Un dashboard personnel conçu pour rassembler vos services, organiser vos informations et garder l’essentiel à portée de regard.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#connection">Découvrir le projet <Icon name="arrow" size={17} /></a>
              <a className="text-link" href="/api/docs" target="_blank" rel="noreferrer">Explorer l’API</a>
            </div>
          </div>
          <div className="hero-visual reveal" aria-label="Aperçu abstrait du dashboard">
            <div className="visual-top"><span>APERÇU / 01</span><span className="live-dot">LIVE</span></div>
            <div className="orbital-display">
              <span className="orbit orbit-one" /><span className="orbit orbit-two" />
              <div className="visual-core"><Icon name="grid" size={28} /><span>Votre espace</span></div>
              <span className="satellite satellite-one">01</span><span className="satellite satellite-two">02</span><span className="satellite satellite-three">03</span>
            </div>
            <div className="visual-footer"><span>Services connectés</span><strong>React / Rust</strong></div>
          </div>
        </section>

        <section className="statement" aria-label="Vision du produit">
          <p>Simple à comprendre.</p><p>Personnel par nature.</p><p>Construit pour évoluer.</p>
        </section>

        <section className="connection-section" id="connection">
          <div className="section-intro">
            <p className="section-label"><span>02</span> Première fondation</p>
            <h2>Deux technologies.<br />Une seule expérience.</h2>
            <p>L’interface React et l’API Rust communiquent sans exposer la complexité technique à l’utilisateur.</p>
          </div>
          <div className={`connection-demo ${connection}`}>
            <div className="demo-header"><span>Test de connexion</span><span className="connection-status"><i />{statusLabel}</span></div>
            <div className="technology-pair">
              <div><span className="technology-number">01</span><strong>Interface</strong><small>React · JavaScript</small></div>
              <div className="exchange" aria-hidden="true"><span /><Icon name="arrow" size={18} /></div>
              <div><span className="technology-number">02</span><strong>Serveur</strong><small>Axum · Rust</small></div>
            </div>
            <div className="server-response" role="status" aria-live="polite"><span>Réponse</span><p>{message}</p></div>
            <div className="demo-footer"><button onClick={testConnection} disabled={loading}><Icon name="pulse" size={17} />{loading ? 'Test en cours…' : 'Tester la connexion'}</button><small>{lastCheck ? `Dernière vérification · ${lastCheck}` : 'Aucune vérification effectuée'}</small></div>
          </div>
        </section>

        <section className="architecture" id="architecture">
          <div className="architecture-copy">
            <p className="section-label section-label-light"><span>03</span> Architecture ouverte</p>
            <h2>Une API claire,<br />dès le départ.</h2>
            <p>Chaque route est documentée et testable dans une interface Swagger dédiée. Une base lisible pour construire les futurs services et widgets.</p>
            <a className="button button-light" href="/api/docs" target="_blank" rel="noreferrer">Ouvrir Swagger UI <Icon name="external" size={16} /></a>
          </div>
          <div className="api-object" aria-label="Endpoint actuellement disponible">
            <div className="api-object-meta"><span>ENDPOINT ACTIF</span><span>200 OK</span></div>
            <div className="api-route"><span>GET</span><code>/api/health</code></div>
            <div className="api-lines"><span /><span /><span /></div>
            <p>La documentation évolue automatiquement avec le code Rust.</p>
          </div>
        </section>

        <section className="roadmap">
          <p className="section-label"><span>04</span> La suite</p>
          <div className="roadmap-heading"><h2>Le socle est prêt.<br /><em>Construisons l’usage.</em></h2><p>Comptes utilisateurs, services connectés et widgets personnalisables formeront les prochaines étapes du produit.</p></div>
          <div className="roadmap-list">
            <article><span>01</span><h3>Identité</h3><p>Création de compte, connexion et espace personnel sécurisé.</p></article>
            <article><span>02</span><h3>Services</h3><p>Des sources externes choisies et configurées par chaque utilisateur.</p></article>
            <article><span>03</span><h3>Widgets</h3><p>Une interface modulable qui s’adapte aux usages quotidiens.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand">LUMI<span>Projet G-WEB-500</span></div><p>Un espace personnel.<br />Une vision plus claire.</p><div className="footer-meta"><a href="/api/docs" target="_blank" rel="noreferrer">Documentation API</a><span>React + Rust</span><span>2026</span></div></footer>
      {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setLoginOpen(false)}>
        <section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <button className="modal-close" onClick={() => setLoginOpen(false)} aria-label="Fermer">×</button>
          <p className="section-label"><span>01</span> Espace personnel</p>
          <h2 id="login-title">Bienvenue sur Lumi.</h2>
          <p>Connectez-vous pour accéder à votre dashboard.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue="demo@lumi.local" required />
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="button button-dark login-submit" disabled={authLoading}>{authLoading ? 'Connexion…' : 'Accéder au dashboard'}<Icon name="arrow" size={17} /></button>
          </form>
          <small>Compte de démonstration : demo@lumi.local · mot de passe : lumi-demo</small>
        </section>
      </div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
