import React from 'react';

export default function WeatherWidget({ widget }) {
  return (
    <div className="weather-content">
      <strong>{widget.temperature || '18°'}</strong>
      <span>{widget.condition || 'Éclaircies'}</span>
      <small>{widget.city || 'Paris'} · Mis à jour maintenant</small>
    </div>
  );
}

