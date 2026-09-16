import React, { useEffect, useRef, useState } from 'react';

const WIDGET_TYPES = {
  weather: { label: 'Météo', eyebrow: 'Conditions locales', icon: '☼', color: 'sand' },
  agenda: { label: 'Agenda', eyebrow: 'Aujourd’hui', icon: '◷', color: 'blue' },
  focus: { label: 'Focus', eyebrow: 'Rythme personnel', icon: '◎', color: 'red' },
  notes: { label: 'Notes', eyebrow: 'Bloc libre', icon: '≡', color: 'mint' },
};

const INITIAL_WIDGETS = [
  { id: 1, type: 'weather', title: 'Météo', x: 1, y: 1, width: 6, height: 1, city: 'Paris', temperature: '18°', condition: 'Éclaircies' },
  { id: 2, type: 'agenda', title: 'Agenda', x: 7, y: 1, width: 6, height: 1, nextEvent: 'Revue produit', time: '14:30', detail: 'Salle Atlas · 45 min' },
  { id: 3, type: 'focus', title: 'Focus', x: 1, y: 2, width: 6, height: 1, duration: 25, completed: 3 },
  { id: 4, type: 'notes', title: 'Notes rapides', x: 7, y: 2, width: 6, height: 1, content: 'Idées à noter pour la prochaine session.' },
];

function widgetsOverlap(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
}

function isFree(widget, placed) {
  return widget.x >= 1 && widget.x + widget.width <= 13 && widget.y >= 1 && !placed.some(other => widgetsOverlap(widget, other));
}

function findFreePosition(widget, placed) {
  const directions = ['up', 'down', 'left', 'right'];
  const candidates = [];
  placed.filter(other => widgetsOverlap(widget, other)).forEach(other => {
    directions.forEach(direction => {
      const candidate = { ...widget };
      if (direction === 'up') candidate.y = other.y - widget.height;
      if (direction === 'down') candidate.y = other.y + other.height;
      if (direction === 'left') candidate.x = other.x - widget.width;
      if (direction === 'right') candidate.x = other.x + other.width;
      candidates.push(candidate);
    });
  });
  const preferred = candidates.find(candidate => isFree(candidate, placed));
  if (preferred) return preferred;

  for (let y = 1; y <= Math.max(12, ...placed.map(item => item.y + item.height)); y += 1) {
    for (let x = 1; x <= 13 - widget.width; x += 1) {
      const candidate = { ...widget, x, y };
      if (isFree(candidate, placed)) return candidate;
    }
  }
  return { ...widget, x: 1, y: Math.max(1, ...placed.map(item => item.y + item.height)) };
}

function resolveLayout(widgets, priorityId) {
  const priority = widgets.find(widget => widget.id === priorityId);
  const others = widgets.filter(widget => widget.id !== priorityId);
  const placed = priority ? [priority] : [];
  others.forEach(widget => placed.push(isFree(widget, placed) ? widget : findFreePosition(widget, placed)));
  return placed;
}

function WidgetIcon({ type }) {
  return <span className="widget-icon" aria-hidden="true">{WIDGET_TYPES[type].icon}</span>;
}

function WidgetContent({ widget }) {
  if (widget.type === 'weather') return <div className="weather-content"><strong>{widget.temperature}</strong><span>{widget.condition}</span><small>{widget.city} · Mis à jour maintenant</small></div>;
  if (widget.type === 'agenda') return <div className="agenda-content"><span className="agenda-time">{widget.time}</span><strong>{widget.nextEvent}</strong><small>{widget.detail}</small></div>;
  if (widget.type === 'focus') return <div className="focus-content"><div className="focus-ring"><strong>{widget.duration}</strong><small>min</small></div><div><strong>{widget.completed} sessions</strong><small>de concentration cette semaine</small></div></div>;
  return <div className="notes-content"><p>{widget.content || 'Une idée à noter...'}</p><small>Dernière modification · à l’instant</small></div>;
}

function WidgetCard({ widget, onEdit, onRemove, onDragStart, onDragEnd, onResizeStart }) {
  const type = WIDGET_TYPES[widget.type];
  return (
    <article className={`widget-card widget-${type.color}`} style={{ gridColumn: `${widget.x} / span ${widget.width}`, gridRow: `${widget.y} / span ${widget.height}` }} draggable onDragStart={event => onDragStart(event, widget.id)} onDragEnd={onDragEnd}>
      <div className="widget-card-header">
        <div className="widget-heading"><WidgetIcon type={widget.type} /><div><span>{type.eyebrow}</span><h3>{widget.title}</h3></div></div>
        <div className="widget-actions">
          <button type="button" className="icon-button" onClick={() => onEdit(widget)} aria-label={`Modifier ${widget.title}`} title="Modifier">✎</button>
          <button type="button" className="icon-button danger" onClick={() => onRemove(widget.id)} aria-label={`Supprimer ${widget.title}`} title="Supprimer">×</button>
        </div>
      </div>
      <WidgetContent widget={widget} />
      <span className="drag-hint">Glisser pour déplacer</span>
      <button type="button" className="widget-resize-handle" draggable="false" onDragStart={event => event.preventDefault()} onPointerDown={event => onResizeStart(event, widget)} aria-label={`Redimensionner ${widget.title}`} title="Redimensionner"><span aria-hidden="true" /></button>
    </article>
  );
}

function WidgetEditor({ widget, mode, onClose, onSave }) {
  const [draft, setDraft] = useState(widget || { type: 'weather', title: 'Météo', city: 'Paris', x: 1, y: 3, width: 4, height: 1 });
  const type = WIDGET_TYPES[draft.type];
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }));

  function submit(event) {
    event.preventDefault();
    onSave({ ...draft, title: draft.title.trim() || type.label });
  }

  return <div className="modal-backdrop widget-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="widget-editor" role="dialog" aria-modal="true" aria-labelledby="widget-editor-title">
      <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
      <p className="section-label"><span>{mode === 'add' ? '01' : '02'}</span> {mode === 'add' ? 'Nouveau widget' : 'Configuration'}</p>
      <h2 id="widget-editor-title">{mode === 'add' ? 'Composer un nouvel espace.' : 'Ajuster votre widget.'}</h2>
      <form onSubmit={submit}>
        {mode === 'add' && <div className="widget-type-picker">{Object.entries(WIDGET_TYPES).map(([key, value]) => <button type="button" className={draft.type === key ? 'selected' : ''} key={key} onClick={() => update('type', key)}><span>{value.icon}</span>{value.label}</button>)}</div>}
        <label htmlFor="widget-title">Nom du widget</label>
        <input id="widget-title" value={draft.title} onChange={event => update('title', event.target.value)} maxLength="34" required />
        {draft.type === 'weather' && <><label htmlFor="widget-city">Ville</label><input id="widget-city" value={draft.city} onChange={event => update('city', event.target.value)} maxLength="24" /></>}
        {draft.type === 'notes' && <><label htmlFor="widget-content">Contenu</label><textarea id="widget-content" value={draft.content || ''} onChange={event => update('content', event.target.value)} rows="3" maxLength="120" /></>}
        {draft.type === 'focus' && <><label htmlFor="widget-duration">Durée d’une session (minutes)</label><input id="widget-duration" type="number" min="5" max="120" value={draft.duration} onChange={event => update('duration', Number(event.target.value))} /></>}
        <div className="widget-size-fields"><div><label htmlFor="widget-width">Largeur · cases</label><input id="widget-width" type="number" min="1" max="12" value={draft.width} onChange={event => update('width', Number(event.target.value))} /></div><div><label htmlFor="widget-height">Hauteur · lignes</label><input id="widget-height" type="number" min="1" max="6" value={draft.height} onChange={event => update('height', Number(event.target.value))} /></div></div>
        <div className="widget-size-fields"><div><label htmlFor="widget-x">Position horizontale</label><input id="widget-x" type="number" min="1" max="12" value={draft.x} onChange={event => update('x', Number(event.target.value))} /></div><div><label htmlFor="widget-y">Position verticale</label><input id="widget-y" type="number" min="1" max="12" value={draft.y} onChange={event => update('y', Number(event.target.value))} /></div></div>
        <button className="button button-dark widget-save" type="submit">{mode === 'add' ? 'Ajouter au dashboard' : 'Enregistrer les changements'} <span aria-hidden="true">→</span></button>
      </form>
    </section>
  </div>;
}

export default function WidgetDashboard() {
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [editor, setEditor] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [resizeSession, setResizeSession] = useState(null);
  const [manualRows, setManualRows] = useState(3);
  const boardRef = useRef(null);
  const gridRows = Math.max(manualRows, ...widgets.map(widget => widget.y + widget.height - 1)) + (draggedId !== null ? 1 : 0);

  useEffect(() => {
    if (!resizeSession) return undefined;
    function resizeWidget(event) {
      const board = boardRef.current;
      if (!board) return;
      const styles = window.getComputedStyle(board);
      const paddingLeft = parseFloat(styles.paddingLeft);
      const gap = parseFloat(styles.columnGap);
      const cellWidth = (board.clientWidth - paddingLeft - parseFloat(styles.paddingRight) - gap * 11) / 12;
      const widthChange = Math.round((event.clientX - resizeSession.startX) / (cellWidth + gap));
      const heightChange = Math.round((event.clientY - resizeSession.startY) / (158 + parseFloat(styles.rowGap)));
      setWidgets(current => resolveLayout(current.map(widget => {
        if (widget.id !== resizeSession.id) return widget;
        return { ...widget, width: Math.min(12 - widget.x + 1, Math.max(1, resizeSession.width + widthChange)), height: Math.max(1, resizeSession.height + heightChange) };
      }), resizeSession.id));
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
    const width = Math.min(12, Math.max(1, Number(widget.width) || 1));
    const height = Math.min(12, Math.max(1, Number(widget.height) || 1));
    const x = Math.min(13 - width, Math.max(1, Number(widget.x) || 1));
    const y = Math.max(1, Number(widget.y) || 1);
    const nextWidget = { ...widget, x, y, width, height };
    if (editor.mode === 'add') {
      const addedWidget = { ...nextWidget, id: Date.now() };
      setWidgets(current => resolveLayout([...current, addedWidget], addedWidget.id));
    } else setWidgets(current => resolveLayout(current.map(item => item.id === widget.id ? nextWidget : item), widget.id));
    setEditor(null);
  }

  function moveWidget(event) {
    event.preventDefault();
    if (draggedId === null || !dragPreview) return;
    setWidgets(current => resolveLayout(current.map(widget => widget.id === draggedId ? { ...widget, x: dragPreview.x, y: dragPreview.y } : widget), draggedId));
    setDraggedId(null);
    setDragPreview(null);
  }

  function startResize(event, widget) {
    event.preventDefault();
    event.stopPropagation();
    setResizeSession({ id: widget.id, startX: event.clientX, startY: event.clientY, width: widget.width, height: widget.height });
  }

  function updateDragPreview(event) {
    if (draggedId === null) return;
    const board = event.currentTarget.getBoundingClientRect();
    const draggedWidget = widgets.find(widget => widget.id === draggedId);
    if (!draggedWidget) return;
    const styles = window.getComputedStyle(event.currentTarget);
    const paddingLeft = parseFloat(styles.paddingLeft);
    const paddingTop = parseFloat(styles.paddingTop);
    const columnGap = parseFloat(styles.columnGap);
    const rowGap = parseFloat(styles.rowGap);
    const usableWidth = event.currentTarget.clientWidth - paddingLeft - parseFloat(styles.paddingRight) - columnGap * 11;
    const cellWidth = usableWidth / 12;
    const column = Math.max(1, Math.min(13 - draggedWidget.width, Math.floor((event.clientX - board.left - paddingLeft) / (cellWidth + columnGap)) + 1));
    const row = Math.max(1, Math.floor((event.clientY - board.top - paddingTop) / (158 + rowGap)) + 1);
    setDragPreview({ x: column, y: row, width: draggedWidget.width, height: draggedWidget.height });
  }

  return <section className="widget-workspace" aria-labelledby="widget-space-title">
    <div className="widget-workspace-header">
      <div><p className="section-label"><span>02</span> Espace modulable</p><h2 id="widget-space-title">Votre dashboard,<br /><em>à votre rythme.</em></h2></div>
      <button className="button button-dark add-widget-button" onClick={() => setEditor({ mode: 'add' })}><span aria-hidden="true">+</span> Ajouter un widget</button>
    </div>
    <div className="widget-board-meta"><span>{widgets.length} widgets actifs</span><span>12 × 3 · GLISSER / DÉPOSER</span></div>
    <div ref={boardRef} className={`widget-board ${draggedId !== null ? 'is-dragging' : ''}`} style={{ '--widget-grid-rows': gridRows }} onDragOver={event => { event.preventDefault(); updateDragPreview(event); }} onDrop={moveWidget}>
      {draggedId !== null && <div className="widget-grid-dots" aria-hidden="true">{Array.from({ length: gridRows * 12 }, (_, index) => <span key={index} />)}</div>}
      {dragPreview && <div className="widget-drag-preview" style={{ gridColumn: `${dragPreview.x} / span ${dragPreview.width}`, gridRow: `${dragPreview.y} / span ${dragPreview.height}` }} aria-hidden="true" />}
      {widgets.map(widget => <WidgetCard key={widget.id} widget={widget} onEdit={item => setEditor({ mode: 'edit', widget: item })} onRemove={id => setWidgets(current => current.filter(widget => widget.id !== id))} onResizeStart={startResize} onDragStart={(event, id) => { setDraggedId(id); setDragPreview(null); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(id)); }} onDragEnd={() => { setDraggedId(null); setDragPreview(null); }} />)}
    </div>
    <div className="widget-row-controls"><button type="button" className="add-row-button" onClick={() => setManualRows(rows => rows + 1)} aria-label="Ajouter une ligne" title="Ajouter une ligne">+</button><span>{gridRows} lignes disponibles</span></div>
    {editor && <WidgetEditor widget={editor.widget} mode={editor.mode} onClose={() => setEditor(null)} onSave={saveWidget} />}
  </section>;
}

