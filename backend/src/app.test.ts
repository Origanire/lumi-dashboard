import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createApp } from './app.js';

test('API : réponse de santé et route inconnue', async () => {
  const app = createApp();
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  try {
    const address = app.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.status, 'ok');
    assert.equal(typeof data.message, 'string');
    const missing = await fetch(`${base}/api/missing`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => app.close(error => error ? reject(error) : resolve()));
  }
});
