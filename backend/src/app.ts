import { createServer } from 'node:http';
import { openapi } from './openapi.js';
import { swaggerAssets, swaggerHtml } from './swagger.js';

export function createApp() {
  return createServer((request, response) => {
    const path = request.url?.split('?')[0];
    if (request.method === 'GET') {
      if (path === '/api/docs' || path === '/api/docs/') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(swaggerHtml);
        return;
      }
      const asset = swaggerAssets.get(path ?? '');
      if (asset) {
        response.writeHead(200, { 'Content-Type': asset.type });
        response.end(asset.body);
        return;
      }
      if (path === '/api/openapi.json') {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(openapi));
        return;
      }
    }
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (request.method === 'GET' && path === '/api/health') {
      response.writeHead(200);
      response.end(JSON.stringify({ status: 'ok', message: 'Connexion réussie ! Le backend TypeScript répond au frontend React.' }));
      return;
    }
    response.writeHead(404);
    response.end(JSON.stringify({ message: 'Route introuvable.' }));
  });
}
