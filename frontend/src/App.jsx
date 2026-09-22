import React, { useEffect, useState } from 'react';
import WidgetDashboard from './WidgetDashboard';
import AuthDialog from './components/AuthDialog';
import EmailAction, { readEmailAction } from './components/EmailAction';
import api from './api';
import { ROLE_LABELS, SESSION_TOKEN_KEY } from './config';

const initialEmailAction = readEmailAction();


function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5m4-8h8m-4-4 4 4-4 4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
function Brand() {
  return (
    <a className="brand" href="/" aria-label="Lumi, accueil">
      LUMI<span className="brand-dot">.</span>
    </a>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    document.documentElement.dataset.theme === 'dark',
  );
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.dataset.theme === 'dark');
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setDark(next === 'dark');
    try {
      localStorage.setItem('lumi_theme', next);
    } catch {
      /* The theme still works for this page. */
    }
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Mode nuit"
      aria-pressed={dark}
      onClick={toggle}
      title={dark ? 'Passer en mode jour' : 'Passer en mode nuit'}
    >
      {dark ? (
        <Icon name="sun" size={17} />
      ) : (
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
        </svg>
      )}
      <span>{dark ? 'Nuit' : 'Jour'}</span>
    </button>
  );
}



const LANDING_PREVIEWS = {
  notes: [
    '01 / Poser ses idées',
    'Moins d’onglets.\nPlus de place pour penser.',
    'Une note, un rendez-vous, une pause. Chaque chose trouve sa place.',
  ],
  focus: [
    '02 / Prendre son temps',
    '25 minutes.\nUne seule chose à la fois.',
    'Lancez un temps de concentration et avancez à votre rythme.',
  ],
  agenda: [
    '03 / Voir sa journée',
    'Le prochain rendez-vous,\nsans le chercher.',
    'Gardez vos repères du jour juste à côté de vos notes.',
  ],
};

function Landing({ onOpen }) {
  const [preview, setPreview] = useState('notes');

  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand />
        <nav aria-label="Navigation principale">
          <a href="#apercu">L’espace Lumi</a>
          <ThemeToggle />
          <button className="text-button" onClick={() => onOpen('login')}>
            Se connecter
          </button>
          <button
            className="button button-dark"
            onClick={() => onOpen('register')}
          >
            Créer un compte <Icon name="arrow" size={16} />
          </button>
        </nav>
      </header>
      <main id="main">
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <i className="status-dot" /> Votre quotidien, à portée de main
            </span>
            <h1>
              Votre quotidien.
              <br />
              <em>Sous contrôle.</em>
            </h1>
            <p>
              Vos idées, vos rendez-vous et un peu de musique.
              <br className="desktop-break" /> Un espace calme pour organiser
              vos journées.
            </p>
            <div className="hero-actions">
              <button
                className="button button-dark"
                onClick={() => onOpen('register')}
              >
                Composer mon espace <Icon name="arrow" size={18} />
              </button>
              <a className="text-link" href="#apercu">
                Jeter un œil ↓
              </a>
            </div>
            <span className="hero-footnote">
              Personnel ou professionnel. Toujours à votre façon.
            </span>
          </div>
          <div
            className="product-preview"
            aria-label="Aperçu du tableau de bord"
          >
            <div className="preview-bar">
              <span className="preview-logo">lumi.</span>
              <span>
                Mon espace <span aria-hidden="true">↗</span>
              </span>
            </div>
            <div className="preview-heading">
              <small>UN PEU DE CLARTÉ</small>
              <strong>
                Une belle journée
                <br />
                commence ici.
              </strong>
              <span className="preview-sun">
                <Icon name="sun" size={38} />
              </span>
            </div>
            <div className="preview-grid">
              <div className="preview-note">
                <span>↗ &nbsp; CARNET</span>
                <p>
                  Une idée à garder.
                  <br />
                  Un projet à lancer.
                  <br />
                  <em>À vous de jouer.</em>
                </p>
                <i />
              </div>
              <div className="preview-focus">
                <span>UN MOMENT POUR SOI</span>
                <strong>
                  25<span>:00</span>
                </strong>
                <span className="preview-start">▶ &nbsp; Se concentrer</span>
              </div>
              <div className="preview-agenda">
                <span className="preview-time">14:30</span>
                <div>
                  <strong>Faire le point</strong>
                  <small>Prendre du recul, puis avancer.</small>
                </div>
                <span>↗</span>
              </div>
            </div>
            <div className="preview-bottom">
              <span>Votre espace, vos repères.</span>
              <span>01 — 03</span>
            </div>
          </div>
        </section>
        <section id="apercu" className="feature-section">
          <div>
            <span className="eyebrow">À chacun son organisation</span>
            <h2>
              Un bureau qui
              <br />
              vous ressemble.
            </h2>
            <p>
              Ajoutez ce qui vous aide. Déplacez ce qui vous gêne. Gardez le
              reste pour plus tard.
            </p>
            <div
              className="feature-tabs"
              role="tablist"
              aria-label="Découvrir les widgets"
            >
              {[
                ['notes', 'Notes'],
                ['focus', 'Focus'],
                ['agenda', 'Agenda'],
              ].map(([key, label], index, tabs) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  role="tab"
                  aria-selected={preview === key}
                  aria-controls="feature-panel"
                  tabIndex={preview === key ? 0 : -1}
                  onClick={() => setPreview(key)}
                  onKeyDown={(e) => {
                    if (
                      ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)
                    ) {
                      e.preventDefault();
                      const next =
                        e.key === 'Home'
                          ? 0
                          : e.key === 'End'
                            ? tabs.length - 1
                            : (index +
                                (e.key === 'ArrowRight' ? 1 : -1) +
                                tabs.length) %
                              tabs.length;
                      setPreview(tabs[next][0]);
                      document.getElementById(`tab-${tabs[next][0]}`).focus();
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            id="feature-panel"
            className={`feature-panel feature-${preview}`}
            role="tabpanel"
            aria-labelledby={`tab-${preview}`}
          >
            <span className="eyebrow">{LANDING_PREVIEWS[preview][0]}</span>
            <h3>{LANDING_PREVIEWS[preview][1]}</h3>
            <p>{LANDING_PREVIEWS[preview][2]}</p>
            <button className="text-button" onClick={() => onOpen('register')}>
              Essayer dans mon espace <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <span>Un peu de clarté dans votre journée.</span>
        <a href="/api/docs" target="_blank" rel="noreferrer">
          Documentation API ↗
        </a>
      </footer>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [logoutBusy, setLogoutBusy] = useState(false);
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
  return (
    <div className="workspace-shell">
      <header className="workspace-nav">
        <Brand />

        <nav aria-label="Espace de travail">
          <button
            className={view === 'dashboard' ? 'active' : ''}
            aria-current={view === 'dashboard' ? 'page' : undefined}
            onClick={() => setView('dashboard')}
          >
            <Icon name="grid" />
            Tableau de bord
          </button>
          <button
            className={view === 'account' ? 'active' : ''}
            aria-current={view === 'account' ? 'page' : undefined}
            onClick={() => setView('account')}
          >
            <Icon name="user" />
            Mon compte
          </button>
        </nav>
        <div className="workspace-user-actions">
          <ThemeToggle />
          <div className="workspace-account">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{user.name} {user.email_verified && <span className="verified-mark" aria-label="Adresse e-mail vérifiée" title="Adresse e-mail vérifiée">✓</span>}</strong>
              <small>{ROLE_LABELS[user.role]}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              disabled={logoutBusy}
              onClick={async () => {
                setLogoutBusy(true);
                try {
                  await onLogout();
                } finally {
                  setLogoutBusy(false);
                }
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="workspace-body">
        <main id="main" className="dashboard-main">
          <div hidden={view !== 'dashboard'}>
            <div className="dashboard-intro">
              <div>
                <p className="eyebrow">{date}</p>
                <h1>
                  Bonjour, {user.name.split(' ')[0]}
                  <span className="brand-dot">.</span>
                </h1>
                <p className="muted">
                  {user.role === 'entreprise'
                    ? `${user.companies[0]?.name || 'Votre entreprise'} — vos repères pour la journée.`
                    : 'Prenez un instant. Votre journée commence ici.'}
                </p>
              </div>
              <span className="greeting-symbol" aria-hidden="true" />
            </div>
            <WidgetDashboard key={user.id} userId={user.id} />
          </div>
          {view === 'account' && (
            <section className="account-page">
              <span className="eyebrow">Vos informations</span>
              <h1>
                Mon compte<span className="brand-dot">.</span>
              </h1>
              <p className="muted">
                Les informations associées à votre espace Lumi.
              </p>
              <div className="account-card">
                <span className="avatar large">{initials}</span>
                <dl>
                  <div>
                    <dt>Nom</dt>
                    <dd>{user.name}</dd>
                  </div>
                  <div>
                    <dt>Adresse e-mail</dt>
                    <dd>{user.email} {user.email_verified && <span className="verification-badge">✓ Adresse e-mail vérifiée</span>}</dd>
                  </div>
                  <div>
                    <dt>Rôles attribués</dt>
                    <dd>{user.roles.map((r) => ROLE_LABELS[r]).join(', ')}</dd>
                  </div>
                  {user.companies.length > 0 && (
                    <div>
                      <dt>Entreprise</dt>
                      <dd>{user.companies.map((c) => c.name).join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <p className="field-hint">
                Le type de compte est défini à la création. Les droits sont
                vérifiés par le serveur.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [emailAction, setEmailAction] = useState(initialEmailAction);
  const [restoring, setRestoring] = useState(
    !initialEmailAction && !!sessionStorage.getItem(SESSION_TOKEN_KEY),
  );
  const [sessionError, setSessionError] = useState('');
  async function restore() {
    setRestoring(true);
    setSessionError('');
    try {
      setUser(await api('/auth/me'));
    } catch (err) {
      if (err.status === 401) sessionStorage.removeItem(SESSION_TOKEN_KEY);
      else setSessionError(err.message);
    } finally {
      setRestoring(false);
    }
  }
  useEffect(() => {
    if (!initialEmailAction && sessionStorage.getItem(SESSION_TOKEN_KEY)) restore();
  }, []);
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (err) {
      if (err.status !== 401) {
        setSessionError(err.message);
        return;
      }
    }
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setUser(null);
    setSessionError('');
  }
  if (emailAction) return <EmailAction action={emailAction} api={api}
    onLogin={data => { setUser(data); setEmailAction(null); setRestoring(false); }}
    onDone={mode => { sessionStorage.removeItem(SESSION_TOKEN_KEY); setUser(null); setEmailAction(null); setRestoring(false); setAuthMode(mode); }} />;
  if (restoring)
    return (
      <div className="loading-screen" role="status">
        <Brand />
        <p>Ouverture de votre espace…</p>
      </div>
    );
  return (
    <>
      <a href="#main" className="skip-link">
        Aller au contenu
      </a>
      {sessionError && (
        <div className="session-alert" role="alert">
          {sessionError}
          <button onClick={restore}>Réessayer</button>
          <button
            onClick={() => setSessionError('')}
            aria-label="Fermer le message"
          >
            ×
          </button>
        </div>
      )}
      {user ? (
        <Dashboard user={user} onLogout={logout} />
      ) : (
        <Landing onOpen={setAuthMode} />
      )}
      {!user && authMode && (
        <AuthDialog
          api={api}
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onLogin={(data) => {
            setUser(data);
            setAuthMode(null);
            setSessionError('');
          }}
        />
      )}
    </>
  );
}

