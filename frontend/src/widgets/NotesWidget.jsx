import React from 'react';

export default function NotesWidget({ widget }) {
  return (
    <div className="notes-content">
      <p>{widget.content || 'Une idée à noter...'}</p>
      <small>Dernière modification · à l’instant</small>
    </div>
  );
}

