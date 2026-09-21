import React from 'react';
import WeatherWidget from './WeatherWidget';
import AgendaWidget from './AgendaWidget';
import CalendarWidget from './calendar/CalendarWidget';
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
  weather: {
    label: 'Météo',
    eyebrow: 'Conditions locales',
    icon: '☼',
    color: 'sand',
    defaultWidth: 6,
    defaultHeight: 2,
  },
  agenda: {
    label: 'Agenda · Échéances du mois',
    eyebrow: 'Google Calendar · Mois',
    icon: '◷',
    color: 'blue',
    defaultWidth: 6,
    defaultHeight: 3,
  },
  calendar_week: {
    label: 'Agenda · Semaine et jour',
    eyebrow: 'Google Calendar · Planning',
    icon: '▦',
    color: 'blue',
    defaultWidth: 6,
    defaultHeight: 4,
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
    defaultWidth: 6,
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
  weather: ['type', 'title', 'city'],
  agenda: ['type', 'title'],
  calendar_week: ['type', 'title'],
  focus: ['type', 'title', 'duration'],
  notes: ['type', 'title', 'content'],
  spotify_player: ['type', 'title', 'clientId', 'refreshInterval'],
  spotify_top: ['type', 'title', 'clientId', 'timeRange', 'limit'],
};

export function WidgetContent({ widget, onChange }) {
  switch (widget.type) {
    case 'weather':
      return <WeatherWidget widget={widget} />;
    case 'agenda':
      return <AgendaWidget widget={widget} />;
    case 'calendar_week':
      return <CalendarWidget mode="week" />;
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

  if (draft.type === 'agenda' || draft.type === 'calendar_week') {
    return <p className="field-hint">Connectez Google Calendar depuis le widget. Les événements sont synchronisés avec votre agenda principal ; la priorité, les labels techniques et l’échéance se renseignent lors de leur création.</p>;
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
