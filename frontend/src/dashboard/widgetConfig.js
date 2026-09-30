import { WIDGET_CONFIG_KEYS } from '../widgets/catalog.js';

export function widgetConfigKey(widget) {
  const keys = [
    ...(WIDGET_CONFIG_KEYS[widget.type] || ['type', 'title']),
    'refreshInterval',
  ];
  return JSON.stringify(
    keys.reduce((config, key) => {
      const value = widget[key];
      config[key] = typeof value === 'string' ? value.trim() : (value ?? '');
      return config;
    }, {}),
  );
}
