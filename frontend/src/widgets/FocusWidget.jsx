import React from 'react';

export default function FocusWidget({ widget }) {
  return (
    <div className="focus-content">
      <div className="focus-ring">
        <strong>{widget.duration ?? 25}</strong>
        <small>min</small>
      </div>
      <div>
        <strong>{widget.completed ?? 0} sessions</strong>
        <small>de concentration cette semaine</small>
      </div>
    </div>
  );
}

