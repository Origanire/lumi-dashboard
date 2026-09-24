import React from 'react';
import GmailWidget, { GmailComposeWidget } from './gmail/GmailWidget';
import WeatherWidget from './WeatherWidget';
import AgendaWidget from './AgendaWidget';
import FocusWidget from './FocusWidget';
import NotesWidget from './NotesWidget';
import SpotifyNowPlayingWidget from './spotify/SpotifyNowPlayingWidget';
import SpotifyTopTracksWidget from './spotify/SpotifyTopTracksWidget';

export {
  WeatherWidget,
  AgendaWidget,
  FocusWidget,
  NotesWidget,
  SpotifyNowPlayingWidget,
  SpotifyTopTracksWidget,
};

export const WIDGET_TYPES = {
  gmail_unread: { label: 'Gmail · Non lus', eyebrow: 'Boîte de réception', icon: '✉', color: 'red', defaultWidth: 6, defaultHeight: 3 },
  gmail_compose: { label: 'Gmail · Rédiger', eyebrow: 'Nouveau message', icon: '✎', color: 'red', defaultWidth: 2, defaultHeight: 1 },
  weather: {
    label: 'Météo',
    eyebrow: 'Conditions locales',
    icon: '☼',
    color: 'sand',
    defaultWidth: 6,
    defaultHeight: 2,
  },
  agenda: {
    label: 'Agenda',
    eyebrow: 'Aujourd’hui',
    icon: '◷',
    color: 'blue',
    defaultWidth: 6,
    defaultHeight: 2,
  },
  focus: {
    label: 'Focus',
    eyebrow: 'Rythme personnel',
    icon: '◎',
    color: 'red',
    defaultWidth: 6,
    defaultHeight: 2,
  },
  notes: {
    label: 'Notes',
    eyebrow: 'Bloc libre',
    icon: '≡',
    color: 'mint',
    defaultWidth: 6,
    defaultHeight: 2,
  },
  spotify_player: {
    label: 'Spotify Now Playing',
    eyebrow: 'En cours d’écoute',
    icon: '♫',
    color: 'spotify',
    defaultWidth: 2,
    defaultHeight: 2,
  },
  spotify_top: {
    label: 'Spotify Top Titres',
    eyebrow: 'Affinités musicales',
    icon: '★',
    color: 'spotify',
    defaultWidth: 6,
    defaultHeight: 2,
  },
};

export const WIDGET_CONFIG_KEYS = {
  gmail_unread: ['type', 'title', 'gmailClientId', 'gmailLimit'],
  gmail_compose: ['type', 'title', 'gmailAccount', 'gmailClientId'],
  weather: ['type', 'title', 'city'],
  agenda: ['type', 'title', 'nextEvent', 'time', 'detail'],
  focus: ['type', 'title', 'duration'],
  notes: ['type', 'title', 'content'],
  spotify_player: ['type', 'title', 'clientId', 'refreshInterval'],
  spotify_top: ['type', 'title', 'clientId', 'timeRange', 'limit'],
};

export function WidgetContent({ widget, onChange }) {
  switch (widget.type) {
    case 'gmail_unread': return <GmailWidget widget={widget} />;
    case 'gmail_compose': return <GmailComposeWidget widget={widget} />;
    case 'weather':
      return <WeatherWidget widget={widget} />;
    case 'agenda':
      return <AgendaWidget widget={widget} />;
    case 'focus':
      return <FocusWidget widget={widget} />;
    case 'notes':
      return <NotesWidget widget={widget} onChange={onChange} />;
    case 'spotify_player':
      return <SpotifyNowPlayingWidget widget={widget} />;
    case 'spotify_top':
      return <SpotifyTopTracksWidget widget={widget} />;
    default:
      return <div>Widget inconnu: {widget.type}</div>;
  }
}

export function WidgetEditorFields({ draft, update }) {
  if (draft.type === 'gmail_unread') return <>
    <label htmlFor="gmail-limit">Nombre de mails à afficher</label>
    <input id="gmail-limit" type="number" min="1" max="20" required value={draft.gmailLimit ?? 5} onChange={event => update('gmailLimit', Number(event.target.value))} />
    <p className="field-hint">Les derniers mails non lus de la boîte de réception. Actualisation chaque minute.</p>
    <label htmlFor="gmail-client">Client ID Google (facultatif si configuré globalement)</label>
    <input id="gmail-client" value={draft.gmailClientId || ''} onChange={event => update('gmailClientId', event.target.value)} placeholder="…apps.googleusercontent.com" />
    <p className="field-hint">Connectez votre compte depuis le widget après sa création.</p>
  </>;
  if (draft.type === 'gmail_compose') return <>
    <label htmlFor="gmail-compose-client">Client ID Google (facultatif si configuré globalement)</label>
    <input id="gmail-compose-client" value={draft.gmailClientId || ''} onChange={event => update('gmailClientId', event.target.value)} placeholder="…apps.googleusercontent.com" />
    <label htmlFor="gmail-account">Compte Gmail (facultatif)</label>
    <input id="gmail-account" type="email" value={draft.gmailAccount || ''} onChange={event => update('gmailAccount', event.target.value)} placeholder="vous@gmail.com" />
    <p className="field-hint">Rédigez dans Lumi et connectez le compte Gmail qui enverra votre message.</p>
  </>;
  if (draft.type === 'weather') {
    return (
      <>
        <p className="field-hint">
          Aperçu avec des données d’exemple, sans connexion à un service météo.
        </p>
        <label htmlFor="widget-city">Ville</label>
        <input
          id="widget-city"
          value={draft.city || ''}
          onChange={(event) => update('city', event.target.value)}
          maxLength="24"
        />
      </>
    );
  }

  if (draft.type === 'agenda') {
    return (
      <>
        <label htmlFor="widget-event">Rendez-vous</label>
        <input
          id="widget-event"
          value={draft.nextEvent || ''}
          onChange={(event) => update('nextEvent', event.target.value)}
          maxLength="100"
          placeholder="Ex. Faire le point"
        />
        <label htmlFor="widget-time">Heure</label>
        <input
          id="widget-time"
          type="time"
          value={draft.time || '14:30'}
          onChange={(event) => update('time', event.target.value)}
        />
        <label htmlFor="widget-detail">Détails</label>
        <input
          id="widget-detail"
          value={draft.detail || ''}
          onChange={(event) => update('detail', event.target.value)}
          maxLength="150"
          placeholder="Lieu, durée…"
        />
        <p className="field-hint">
          Un repère saisi par vous, sans synchronisation avec un calendrier.
        </p>
      </>
    );
  }

  if (draft.type === 'notes') {
    return (
      <>
        <label htmlFor="widget-content">Contenu</label>
        <textarea
          id="widget-content"
          value={draft.content || ''}
          onChange={(event) => update('content', event.target.value)}
          rows="3"
          maxLength="2000"
        />
      </>
    );
  }

  if (draft.type === 'focus') {
    return (
      <>
        <label htmlFor="widget-duration">Durée d’une session (minutes)</label>
        <input
          id="widget-duration"
          type="number"
          min="5"
          max="120"
          value={draft.duration ?? 25}
          onChange={(event) => update('duration', Number(event.target.value))}
        />
      </>
    );
  }

  if (draft.type === 'spotify_player') {
    return (
      <>
        <label htmlFor="widget-spotify-client-id">
          Spotify Client ID (optionnel si configuré globalement)
        </label>
        <input
          id="widget-spotify-client-id"
          type="text"
          placeholder="Ex: 4a3e7b..."
          value={draft.clientId || ''}
          onChange={(event) => update('clientId', event.target.value)}
        />
        <label htmlFor="widget-spotify-refresh">
          Intervalle de rafraîchissement (secondes, min 5)
        </label>
        <input
          id="widget-spotify-refresh"
          type="number"
          min="5"
          max="120"
          value={draft.refreshInterval ?? 10}
          onChange={(event) =>
            update('refreshInterval', Number(event.target.value))
          }
        />
      </>
    );
  }

  if (draft.type === 'spotify_top') {
    return (
      <>
        <label htmlFor="widget-spotify-client-id-top">
          Spotify Client ID (optionnel si configuré globalement)
        </label>
        <input
          id="widget-spotify-client-id-top"
          type="text"
          placeholder="Ex: 4a3e7b..."
          value={draft.clientId || ''}
          onChange={(event) => update('clientId', event.target.value)}
        />
        <div className="widget-size-fields">
          <div>
            <label htmlFor="widget-spotify-timerange">Période</label>
            <select
              id="widget-spotify-timerange"
              value={draft.timeRange || 'short_term'}
              onChange={(event) => update('timeRange', event.target.value)}
            >
              <option value="short_term">4 dernières semaines</option>
              <option value="medium_term">6 derniers mois</option>
              <option value="long_term">Toutes les années</option>
            </select>
          </div>
          <div>
            <label htmlFor="widget-spotify-limit">Nombre de titres</label>
            <input
              id="widget-spotify-limit"
              type="number"
              min="1"
              max="10"
              value={draft.limit ?? 3}
              onChange={(event) => update('limit', Number(event.target.value))}
            />
          </div>
        </div>
      </>
    );
  }

  return null;
}
