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
    const docs = await fetch(`${base}/api/docs`);
    assert.equal(docs.status, 200);
    assert.match(docs.headers.get('content-type') ?? '', /text\/html/);
    assert.match(await docs.text(), /SwaggerUIBundle/);
    for (const [file, contentType] of [
      ['swagger-ui.css', 'text/css'],
      ['swagger-ui-bundle.js', 'application/javascript'],
    ]) {
      const asset = await fetch(`${base}/api/docs/${file}`);
      assert.equal(asset.status, 200);
      assert.ok(asset.headers.get('content-type')?.startsWith(contentType));
      assert.ok((await asset.text()).length > 0);
    }
    const specification = await fetch(`${base}/api/openapi.json`);
    assert.equal(specification.status, 200);
    const spec = await specification.json();
    assert.equal(spec.openapi, '3.0.3');
    assert.ok(spec.paths['/api/health'].get.responses['200']);
    assert.equal(data.status, spec.paths['/api/health'].get.responses['200'].content['application/json'].example.status);
    const missing = await fetch(`${base}/api/missing`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => app.close(error => error ? reject(error) : resolve()));
  }
});
