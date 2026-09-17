import React from 'react';

export default function AgendaWidget({ widget }) {
  return (
    <div className="agenda-content">
      <span className="agenda-time">{widget.time || '14:30'}</span>
      <strong>{widget.nextEvent || 'Prochain événement'}</strong>
      <small>{widget.detail || 'Aucun détail précisé'}</small>
    </div>
  );
}

