import React, { useEffect, useState, useRef } from 'react';
import {
  getCurrentlyPlaying,
  getStoredAuth,
  redirectToSpotifyAuthorize,
  clearStoredAuth,
  getSpotifyRedirectUri,
} from './spotifyClient';

function SpotifyLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="Spotify" role="img">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.305c-.216.353-.674.464-1.026.248-2.812-1.718-6.352-2.107-10.523-1.155-.403.092-.803-.162-.895-.565-.092-.403.162-.803.565-.895 4.568-1.043 8.487-.604 11.63 1.341.353.216.465.674.249 1.026zm1.467-3.26c-.272.443-.854.582-1.297.31-3.218-1.978-8.125-2.55-11.93-1.394-.498.15-1.03-.134-1.18-.632-.15-.499.133-1.03.632-1.181 4.354-1.321 9.76-.684 13.465 1.599.443.272.582.855.31 1.298zm.126-3.41c-3.858-2.29-10.222-2.502-13.899-1.385-.591.18-1.222-.154-1.402-.746-.18-.591.154-1.222.746-1.401 4.227-1.284 11.258-1.038 15.698 1.597.532.316.706 1.008.39 1.54-.316.533-1.008.706-1.54.391l.007.004z" />
    </svg>
  );
}

export default function SpotifyNowPlayingWidget({ widget }) {
  const [auth, setAuth] = useState(getStoredAuth());
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const timerRef = useRef(null);

  const refreshInterval = Math.max(5, Number(widget.refreshInterval) || 10);

  useEffect(() => {
    function handleAuthChange(event) {
      setAuth(event.detail);
    }
    window.addEventListener('lumi:spotify-auth-changed', handleAuthChange);
    return () => window.removeEventListener('lumi:spotify-auth-changed', handleAuthChange);
  }, []);

  async function fetchPlayback() {
    if (!getStoredAuth()) return;
    try {
      setError(null);
      const data = await getCurrentlyPlaying();
      setPlayback(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auth) {
      setPlayback(null);
      return undefined;
    }
    setLoading(true);
    fetchPlayback();

    const intervalMs = refreshInterval * 1000;
    timerRef.current = setInterval(fetchPlayback, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auth, refreshInterval]);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      // Automatic PKCE challenge generation and redirection
      await redirectToSpotifyAuthorize(widget.clientId);
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }

  // Not connected state
  if (!auth) {
    return (
      <div className="spotify-widget-content spotify-disconnected">
        <div className="spotify-badge-header">
          <SpotifyLogo size={18} />
          <span>Spotify Web API</span>
        </div>
        <p className="spotify-notice">
          Connectez votre compte Spotify via le protocole sécurisé PKCE (sans secret exposé).
        </p>
        <button
          type="button"
          className="button button-dark spotify-btn spotify-btn-primary"
          onClick={handleConnect}
          disabled={connecting}
        >
          <SpotifyLogo size={16} />
          {connecting ? 'Génération PKCE & redirection…' : 'Se connecter avec Spotify'}
        </button>
        <small className="spotify-redirect-hint">
          Redirect URI autorisée : <code>{getSpotifyRedirectUri()}</code>
        </small>
        {error && <span className="spotify-error-message">{error}</span>}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="spotify-widget-content spotify-error-state">
        <div className="spotify-badge-header">
          <SpotifyLogo size={16} />
          <span>Spotify</span>
        </div>
        <p className="spotify-error-text">{error}</p>
        <div className="spotify-actions-inline">
          <button type="button" className="button button-light spotify-retry-btn" onClick={fetchPlayback}>
            Réessayer
          </button>
          <button type="button" className="spotify-link-btn" onClick={() => clearStoredAuth()}>
            Déconnecter
          </button>
        </div>
      </div>
    );
  }

  // No playback active (HTTP 204 or item null)
  if (!playback || !playback.item) {
    return (
      <div className="spotify-widget-content spotify-idle">
        <div className="spotify-badge-header">
          <SpotifyLogo size={16} />
          <span>Spotify · En veille</span>
          {loading && <span className="spotify-pulse-dot" title="Actualisation en cours" />}
        </div>
        <div className="spotify-idle-message">
          <p>Aucune musique en cours d'écoute.</p>
          <small>Lancez un titre sur Spotify pour voir les informations s'actualiser ici ({refreshInterval}s).</small>
        </div>
        <div className="spotify-attribution">
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noreferrer noopener"
            className="spotify-attr-link"
          >
            Ouvrir Spotify <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    );
  }

  const track = playback.item;
  const isPlaying = playback.is_playing;
  const albumImage = track.album?.images?.[0]?.url || track.album?.images?.[1]?.url;
  const artists = (track.artists || []).map(a => a.name).join(', ');
  const trackUrl = track.external_urls?.spotify || 'https://open.spotify.com';
  const progressPercent = playback.duration_ms
    ? Math.min(100, Math.round(((playback.progress_ms || 0) / playback.duration_ms) * 100))
    : 0;

  return (
    <div className="spotify-widget-content spotify-playing">
      <div className="spotify-track-row">
        {albumImage ? (
          <img src={albumImage} alt={track.name} className="spotify-album-cover" />
        ) : (
          <div className="spotify-album-placeholder">♪</div>
        )}
        <div className="spotify-track-details">
          <div className="spotify-status-indicator">
            <span className={`spotify-indicator-dot ${isPlaying ? 'is-live' : 'is-paused'}`} />
            <span>{isPlaying ? 'Lecture en cours' : 'En pause'}</span>
          </div>
          <a
            href={trackUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="spotify-track-title"
            title={track.name}
          >
            {track.name}
          </a>
          <span className="spotify-track-artist" title={artists}>
            {artists}
          </span>
        </div>
      </div>

      <div className="spotify-progress-container" aria-label="Progression du morceau">
        <div className="spotify-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="spotify-footer">
        <div className="spotify-attribution">
          <SpotifyLogo size={14} />
          <a href={trackUrl} target="_blank" rel="noreferrer noopener">
            Écouter sur Spotify ↗
          </a>
        </div>
        <small className="spotify-refresh-hint">{refreshInterval}s</small>
      </div>
    </div>
  );
}

