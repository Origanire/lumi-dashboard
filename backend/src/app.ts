import { createServer } from 'node:http';

export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (request.method === 'GET' && request.url?.split('?')[0] === '/api/health') {
      response.writeHead(200);
      response.end(JSON.stringify({ status: 'ok', message: 'Connexion réussie ! Le backend TypeScript répond au frontend React.' }));
      return;
    }
    response.writeHead(404);
    response.end(JSON.stringify({ message: 'Route introuvable.' }));
  });
}
