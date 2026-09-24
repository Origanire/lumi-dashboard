import React, { useEffect, useRef, useState } from 'react';
import Dialog from './components/Dialog';
import useWidgetSize from './hooks/useWidgetSize';
import {
  WIDGET_TYPES,
  WIDGET_CONFIG_KEYS,
  WidgetContent,
  WidgetEditorFields,
} from './widgets';
import {
  handleSpotifyCallback,
  getStoredAuth,
} from './widgets/spotify/spotifyClient';

const INITIAL_WIDGETS = [
  {
    id: 1,
    type: 'weather',
    title: 'Météo',
    x: 1,
    y: 1,
    width: 6,
    height: 2,
    city: 'Paris',
    temperature: '18°',
    condition: 'Éclaircies',
  },
  {
    id: 2,
    type: 'agenda',
    title: 'Agenda',
    x: 7,
    y: 1,
    width: 6,
    height: 2,
    nextEvent: 'Revue produit',
    time: '14:30',
    detail: 'Exemple · à personnaliser',
  },
  {
    id: 3,
    type: 'focus',
    title: 'Focus',
    x: 1,
    y: 3,
    width: 6,
    height: 2,
    duration: 25,
    completed: 0,
  },
  {
    id: 4,
    type: 'notes',
    title: 'Notes rapides',
    x: 7,
    y: 3,
    width: 6,
    height: 2,
    content: 'Idées à noter pour la prochaine session.',
  },
];

function widgetConfigKey(widget) {
  const keys = WIDGET_CONFIG_KEYS[widget.type] || ['type', 'title'];
  return JSON.stringify(
    keys.reduce((config, key) => {
      const value = widget[key];
      config[key] = typeof value === 'string' ? value.trim() : (value ?? '');
      return config;
    }, {})
  );
}

function widgetsOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function isFree(widget, placed) {
  return (
    widget.x >= 1 &&
    widget.x + widget.width <= 13 &&
    widget.y >= 1 &&
    !placed.some((other) => widgetsOverlap(widget, other))
  );
}

function findFreePosition(widget, placed) {
  const directions = ['up', 'down', 'left', 'right'];
  const candidates = [];
  placed
    .filter((other) => widgetsOverlap(widget, other))
    .forEach((other) => {
      directions.forEach((direction) => {
        const candidate = { ...widget };
        if (direction === 'up') candidate.y = other.y - widget.height;
        if (direction === 'down') candidate.y = other.y + other.height;
        if (direction === 'left') candidate.x = other.x - widget.width;
        if (direction === 'right') candidate.x = other.x + other.width;
        candidates.push(candidate);
      });
    });
  const preferred = candidates.find((candidate) => isFree(candidate, placed));
  if (preferred) return preferred;

  for (
    let y = 1;
    y <= Math.max(12, ...placed.map((item) => item.y + item.height));
    y += 1
  ) {
    for (let x = 1; x <= 13 - widget.width; x += 1) {
      const candidate = { ...widget, x, y };
      if (isFree(candidate, placed)) return candidate;
    }
  }
  return {
    ...widget,
    x: 1,
    y: Math.max(1, ...placed.map((item) => item.y + item.height)),
  };
}

function resolveLayout(widgets, priorityId) {
  const priority = widgets.find((widget) => widget.id === priorityId);
  const others = widgets.filter((widget) => widget.id !== priorityId);
  const placed = priority ? [priority] : [];
  others.forEach((widget) =>
    placed.push(
      isFree(widget, placed) ? widget : findFreePosition(widget, placed)
    )
  );
  return placed;
}

function WidgetIcon({ type }) {
  const meta = WIDGET_TYPES[type];
  return (
    <span className="widget-icon" aria-hidden="true">
      {meta?.icon || '◻'}
    </span>
  );
}

function WidgetCard({
  widget,
  onEdit,
  onRemove,
  onDragStart,
  onDragEnd,
  onResizeStart,
  arranging,
  onChange,
}) {
  const sizeRef = useWidgetSize();
  const type = WIDGET_TYPES[widget.type] || {
    label: widget.title,
    eyebrow: 'Widget',
    color: 'sand',
  };
  return (
    <article
      ref={sizeRef}
      className={`widget-card widget-${type.color} ${arranging ? 'is-arranging' : ''} ${widget.type === 'spotify_player' ? 'spotify-widget-card' : ''} ${widget.type === 'gmail_compose' ? 'gmail-compose-card' : ''}`}
      style={{
        gridColumn: `${widget.x} / span ${widget.width}`,
        gridRow: `${widget.y} / span ${widget.height}`,
      }}
    >
      <div
        className="widget-card-header"
        draggable={arranging}
        onDragStart={(event) => onDragStart(event, widget.id)}
        onDragEnd={onDragEnd}
      >
        <div className="widget-heading">
          <WidgetIcon type={widget.type} />
          <div>
            <span>{type.eyebrow}</span>
            <h3>{widget.title}</h3>
          </div>
        </div>
        <div className="widget-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => onEdit(widget)}
            aria-label={`Modifier ${widget.title}`}
            title="Modifier"
          >
            ✎
          </button>
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onRemove(widget.id)}
            aria-label={`Supprimer ${widget.title}`}
            title="Supprimer"
          >
            ×
          </button>
        </div>
      </div>
      <WidgetContent widget={widget} onChange={onChange} />
      {arranging && (
        <span className="drag-hint">
          Déplacer par l’en-tête · ou utiliser Modifier
        </span>
      )}
      {arranging && (
        <button
          type="button"
          className="widget-resize-handle"
          draggable="false"
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={(event) => onResizeStart(event, widget)}
          aria-label={`Redimensionner ${widget.title}`}
          title="Redimensionner"
        >
          <span aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

function WidgetEditor({ widget, mode, onClose, onSave }) {
  const [draft, setDraft] = useState(
    widget || {
      type: 'weather',
      title: 'Météo',
      city: 'Paris',
      x: 1,
      y: 5,
      width: 6,
      height: 2,
    }
  );
  const [error, setError] = useState('');
  const type = WIDGET_TYPES[draft.type] || { label: draft.title };

  const update = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const handleTypeChange = (newType) => {
    const meta = WIDGET_TYPES[newType];
    setDraft((current) => ({
      ...current,
      type: newType,
      title: meta?.label || current.title,
      width: meta?.defaultWidth || current.width || 6,
      height: meta?.defaultHeight || current.height || 1,
    }));
    setError('');
  };

  function submit(event) {
    event.preventDefault();
    const saved = onSave({ ...draft, title: draft.title.trim() || type.label });
    if (!saved)
      setError('Un widget avec exactement ces paramètres existe déjà.');
  }

  return (
    <Dialog
      className="widget-editor"
      titleId="widget-editor-title"
      onClose={onClose}
    >
      <p className="section-label">
        <span>{mode === 'add' ? '01' : '02'}</span>{' '}
        {mode === 'add' ? 'Nouveau widget' : 'Configuration'}
      </p>
      <h2 id="widget-editor-title">
        {mode === 'add' ? 'Ajouter un widget' : 'Modifier le widget'}
      </h2>
      <form onSubmit={submit}>
        {mode === 'add' && (
          <div className="widget-type-picker">
            {Object.entries(WIDGET_TYPES).map(([key, value]) => (
              <button
                type="button"
                className={draft.type === key ? 'selected' : ''}
                key={key}
                aria-pressed={draft.type === key}
                onClick={() => handleTypeChange(key)}
              >
                <span aria-hidden="true">{value.icon}</span>
                {value.label}
              </button>
            ))}
          </div>
        )}
        <label htmlFor="widget-title">Nom du widget</label>
        <input
          id="widget-title"
          value={draft.title}
          onChange={(event) => update('title', event.target.value)}
          maxLength="34"
          required
        />

        <WidgetEditorFields draft={draft} update={update} />

        <details className="layout-options">
          <summary>Taille et position</summary>
          <div className="widget-size-fields">
            <div>
              <label htmlFor="widget-width">Largeur · cases</label>
              <input
                id="widget-width"
                type="number"
                min="1"
                max={type.maxWidth || 12}
                value={draft.width}
                onChange={(event) =>
                  update('width', Number(event.target.value))
                }
              />
            </div>
            <div>
              <label htmlFor="widget-height">Hauteur · lignes</label>
              <input
                id="widget-height"
                type="number"
                min="1"
                max={type.maxHeight || 6}
                value={draft.height}
                onChange={(event) =>
                  update('height', Number(event.target.value))
                }
              />
            </div>
          </div>
          <div className="widget-size-fields">
            <div>
              <label htmlFor="widget-x">Position horizontale</label>
              <input
                id="widget-x"
                type="number"
                min="1"
                max="12"
                value={draft.x}
                onChange={(event) => update('x', Number(event.target.value))}
              />
            </div>
            <div>
              <label htmlFor="widget-y">Position verticale</label>
              <input
                id="widget-y"
                type="number"
                min="1"
                max="100"
                value={draft.y}
                onChange={(event) => update('y', Number(event.target.value))}
              />
            </div>
          </div>
        </details>
        {error && (
          <p className="widget-editor-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-dark widget-save" type="submit">
          {mode === 'add'
            ? 'Ajouter au dashboard'
            : 'Enregistrer les changements'}{' '}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </Dialog>
  );
}

export default function WidgetDashboard({ userId }) {
  const storageKey = `lumi_dashboard_v1_${userId}`;
  const [storageError, setStorageError] = useState('');
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (
        Array.isArray(saved) &&
        saved.every(
          (w) =>
            w &&
            WIDGET_TYPES[w.type] &&
            typeof w.title === 'string' &&
            ['x', 'y', 'width', 'height'].every(
              (k) => Number.isInteger(w[k]) && w[k] >= 1
            ) &&
            w.x + w.width <= 13 &&
            w.y <= 100 &&
            w.height <= 6
        ) &&
        new Set(saved.map((w) => w.id)).size === saved.length
      )
        return saved.map(widget => ({
          ...widget,
          width: Math.min(widget.width, WIDGET_TYPES[widget.type].maxWidth || 12),
          height: Math.min(widget.height, WIDGET_TYPES[widget.type].maxHeight || 6),
        }));
    } catch {
      /* Start with the default layout when storage is unavailable or invalid. */
    }
    return INITIAL_WIDGETS;
  });
  const [arranging, setArranging] = useState(false);
  const [removed, setRemoved] = useState(null);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
      setStorageError('');
    } catch {
      setStorageError(
        'La sauvegarde locale est indisponible. Gardez cette page ouverte pour conserver vos modifications.'
      );
    }
  }, [widgets, storageKey]);
  const [editor, setEditor] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [resizeSession, setResizeSession] = useState(null);
  const [manualRows, setManualRows] = useState(1);
  const boardRef = useRef(null);
  const gridRows =
    Math.max(
      manualRows,
      ...widgets.map((widget) => widget.y + widget.height - 1)
    ) + (draggedId !== null ? 1 : 0);

  // Check for Spotify auth callback in query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') || params.get('error')) {
      const stored = getStoredAuth();
      const clientId =
        stored?.clientId || import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
      handleSpotifyCallback(clientId).catch((err) => {
        console.warn('Spotify auth callback notification:', err.message);
      });
    }
  }, []);

  useEffect(() => {
    if (!resizeSession) return undefined;
    function resizeWidget(event) {
      const board = boardRef.current;
      if (!board) return;
      const styles = window.getComputedStyle(board);
      const paddingLeft = parseFloat(styles.paddingLeft);
      const gap = parseFloat(styles.columnGap);
      const cellWidth =
        (board.clientWidth -
          paddingLeft -
          parseFloat(styles.paddingRight) -
          gap * 11) /
        12;
      const widthChange = Math.round(
        (event.clientX - resizeSession.startX) / (cellWidth + gap)
      );
      const heightChange = Math.round(
        (event.clientY - resizeSession.startY) /
          (128 + parseFloat(styles.rowGap))
      );
      setWidgets((current) =>
        resolveLayout(
          current.map((widget) => {
            if (widget.id !== resizeSession.id) return widget;
            return {
              ...widget,
              width: Math.min(
                12 - widget.x + 1,
                WIDGET_TYPES[widget.type]?.maxWidth || 12,
                Math.max(1, resizeSession.width + widthChange)
              ),
              height: Math.min(
                WIDGET_TYPES[widget.type]?.maxHeight || 6,
                Math.max(1, resizeSession.height + heightChange)
              ),
            };
          }),
          resizeSession.id
        )
      );
    }
    function stopResize() {
      setResizeSession(null);
    }
    window.addEventListener('pointermove', resizeWidget);
    window.addEventListener('pointerup', stopResize);
    return () => {
      window.removeEventListener('pointermove', resizeWidget);
      window.removeEventListener('pointerup', stopResize);
    };
  }, [resizeSession]);

  function saveWidget(widget) {
    const width = Math.min(WIDGET_TYPES[widget.type]?.maxWidth || 12, Math.max(1, Number(widget.width) || 1));
    const height = Math.min(WIDGET_TYPES[widget.type]?.maxHeight || 6, Math.max(1, Number(widget.height) || 1));
    const x = Math.min(13 - width, Math.max(1, Number(widget.x) || 1));
    const y = Math.min(100, Math.max(1, Number(widget.y) || 1));
    const nextWidget = { ...widget, x, y, width, height };
    const duplicate = widgets.some(
      (item) =>
        item.id !== widget.id &&
        widgetConfigKey(item) === widgetConfigKey(nextWidget)
    );
    if (duplicate) return false;
    if (editor.mode === 'add') {
      const addedWidget = { ...nextWidget, id: crypto.randomUUID() };
      setWidgets((current) =>
        resolveLayout([...current, addedWidget], addedWidget.id)
      );
    } else {
      setWidgets((current) =>
        resolveLayout(
          current.map((item) => (item.id === widget.id ? nextWidget : item)),
          widget.id
        )
      );
    }
    setEditor(null);
    return true;
  }

  function moveWidget(event) {
    event.preventDefault();
    if (draggedId === null || !dragPreview) return;
    setWidgets((current) =>
      resolveLayout(
        current.map((widget) =>
          widget.id === draggedId
            ? { ...widget, x: dragPreview.x, y: dragPreview.y }
            : widget
        ),
        draggedId
      )
    );
    setDraggedId(null);
    setDragPreview(null);
  }

  function startResize(event, widget) {
    event.preventDefault();
    event.stopPropagation();
    setResizeSession({
      id: widget.id,
      startX: event.clientX,
      startY: event.clientY,
      width: widget.width,
      height: widget.height,
    });
  }

  function updateDragPreview(event) {
    if (draggedId === null) return;
    const board = event.currentTarget.getBoundingClientRect();
    const draggedWidget = widgets.find((widget) => widget.id === draggedId);
    if (!draggedWidget) return;
    const styles = window.getComputedStyle(event.currentTarget);
    const paddingLeft = parseFloat(styles.paddingLeft);
    const paddingTop = parseFloat(styles.paddingTop);
    const columnGap = parseFloat(styles.columnGap);
    const rowGap = parseFloat(styles.rowGap);
    const usableWidth =
      event.currentTarget.clientWidth -
      paddingLeft -
      parseFloat(styles.paddingRight) -
      columnGap * 11;
    const cellWidth = usableWidth / 12;
    const column = Math.max(
      1,
      Math.min(
        13 - draggedWidget.width,
        Math.floor(
          (event.clientX - board.left - paddingLeft) / (cellWidth + columnGap)
        ) + 1
      )
    );
    const row = Math.max(
      1,
      Math.floor((event.clientY - board.top - paddingTop) / (128 + rowGap)) + 1
    );
    setDragPreview({
      x: column,
      y: row,
      width: draggedWidget.width,
      height: draggedWidget.height,
    });
  }

  return (
    <section className="widget-workspace" aria-labelledby="widget-space-title">
      <div className="widget-workspace-header">
        <div>
          <h2 id="widget-space-title">Votre tableau de bord</h2>
          <p className="muted workspace-subtitle">
            Un espace à composer, un widget à la fois.
          </p>
        </div>
        <div className="workspace-actions">
          <button
            className="button button-secondary"
            aria-pressed={arranging}
            onClick={() => {
              setArranging(!arranging);
              setResizeSession(null);
            }}
          >
            {arranging ? 'Terminer' : 'Organiser'}
          </button>
          <button
            className="button button-dark add-widget-button"
            onClick={() => setEditor({ mode: 'add' })}
          >
            <span aria-hidden="true">+</span> Ajouter un widget
          </button>
        </div>
      </div>
      <div className="widget-board-meta">
        <span>
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
        </span>
        <span>
          {arranging
            ? 'Déplacez les en-têtes ou modifiez la position dans le formulaire.'
            : storageError
              ? 'Sauvegarde indisponible'
              : 'Enregistré sur ce navigateur'}
        </span>
      </div>
      {storageError && (
        <p role="alert" className="feedback error">
          {storageError}
        </p>
      )}
      {removed && (
        <div className="undo-banner" role="status">
          <span>« {removed.title} » a été supprimé.</span>
          <button
            className="text-button"
            onClick={() => {
              setWidgets((current) =>
                resolveLayout([...current, removed], removed.id)
              );
              setRemoved(null);
            }}
          >
            Annuler
          </button>
          <button
            className="icon-button"
            aria-label="Fermer le message"
            onClick={() => setRemoved(null)}
          >
            ×
          </button>
        </div>
      )}
      {widgets.length === 0 && (
        <div className="empty-state">
          <h3>Un peu d’espace pour vos idées.</h3>
          <p>Ajoutez votre premier widget pour commencer.</p>
          <button
            className="button button-dark"
            onClick={() => setEditor({ mode: 'add' })}
          >
            Choisir un widget
          </button>
        </div>
      )}
      <div
        ref={boardRef}
        hidden={widgets.length === 0}
        className={`widget-board ${arranging ? 'is-arranging' : ''} ${draggedId !== null ? 'is-dragging' : ''}`}
        style={{ '--widget-grid-rows': gridRows }}
        onDragOver={(event) => {
          event.preventDefault();
          updateDragPreview(event);
        }}
        onDrop={moveWidget}
      >
        {draggedId !== null && (
          <div className="widget-grid-dots" aria-hidden="true">
            {Array.from({ length: gridRows * 12 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        )}
        {dragPreview && (
          <div
            className="widget-drag-preview"
            style={{
              gridColumn: `${dragPreview.x} / span ${dragPreview.width}`,
              gridRow: `${dragPreview.y} / span ${dragPreview.height}`,
            }}
            aria-hidden="true"
          />
        )}
        {[...widgets]
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              arranging={arranging}
              onChange={(patch) =>
                setWidgets((current) =>
                  current.map((w) =>
                    w.id === widget.id ? { ...w, ...patch } : w
                  )
                )
              }
              onEdit={(item) => setEditor({ mode: 'edit', widget: item })}
              onRemove={(id) => {
                setRemoved(widgets.find((w) => w.id === id));
                setWidgets((current) => current.filter((w) => w.id !== id));
              }}
              onResizeStart={startResize}
              onDragStart={(event, id) => {
                setDraggedId(id);
                setDragPreview(null);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(id));
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragPreview(null);
              }}
            />
          ))}
      </div>
      {arranging && (
        <div className="widget-row-controls">
          <button
            type="button"
            className="add-row-button"
            onClick={() => setManualRows((rows) => rows + 1)}
            aria-label="Ajouter une ligne"
            title="Ajouter une ligne"
          >
            +
          </button>
          <span>{gridRows} lignes disponibles</span>
        </div>
      )}
      {editor && (
        <WidgetEditor
          widget={editor.widget}
          mode={editor.mode}
          onClose={() => setEditor(null)}
          onSave={saveWidget}
        />
      )}
    </section>
  );
}
