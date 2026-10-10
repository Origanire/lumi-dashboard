import HabitsWidget from './habits/HabitsWidget';
import OpenAIWidget from './openai/OpenAIWidget';
import React from 'react';
import GitHubWidget from './github/GitHubWidget';
import GmailWidget from './gmail/GmailWidget';
import GmailComposeWidget from './gmail/GmailComposeWidget';
import WeatherWidget from './WeatherWidget';
import AgendaWidget from './AgendaWidget';
import CalendarWidget from './calendar/CalendarWidget';
import FocusWidget from './FocusWidget';
import NotesWidget from './NotesWidget';
import SpotifyNowPlayingWidget from './spotify/SpotifyNowPlayingWidget';
import SpotifyTopTracksWidget from './spotify/SpotifyTopTracksWidget';

export default function WidgetContent({ widget, onChange, userId }) {
  switch (widget.type) {
    case 'habits':
      return <HabitsWidget widget={widget} onChange={onChange} />;
    case 'openai_chat':
      return <OpenAIWidget />;
    case 'github_pushes':
    case 'github_graph':
      return <GitHubWidget widget={widget} userId={userId} />;
    case 'gmail_unread':
      return <GmailWidget widget={widget} />;
    case 'gmail_compose':
      return <GmailComposeWidget widget={widget} />;
    case 'weather':
      return <WeatherWidget widget={widget} />;
    case 'agenda':
      return <AgendaWidget widget={widget} />;
    case 'calendar_week':
      return <CalendarWidget mode="week" widget={widget} />;
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
