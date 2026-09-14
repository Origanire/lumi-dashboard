import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import swaggerUi from 'swagger-ui-dist';

// Liste explicite des ressources publiques : aucun chemin fourni par le client
// n'est utilisé pour lire un fichier sur le disque.
const assetDirectory = swaggerUi.getAbsoluteFSPath();
export const swaggerAssets = new Map([
  ['/api/docs/swagger-ui.css', {
    type: 'text/css; charset=utf-8',
    body: readFileSync(join(assetDirectory, 'swagger-ui.css')),
  }],
  ['/api/docs/swagger-ui-bundle.js', {
    type: 'application/javascript; charset=utf-8',
    body: readFileSync(join(assetDirectory, 'swagger-ui-bundle.js')),
  }],
]);

export const swaggerHtml = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard API — Swagger UI</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        validatorUrl: null
      });
    </script>
  </body>
</html>`;
