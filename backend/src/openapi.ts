export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Dashboard API',
    version: '0.1.0',
    description: 'API du projet Dashboard. Première étape : communication entre React et TypeScript.',
  },
  servers: [{ url: '/', description: 'Serveur courant' }],
  paths: {
    '/api/health': {
      get: {
        tags: ['État du serveur'],
        summary: 'Vérifier que le backend répond',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Le backend est disponible.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'message'],
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    message: { type: 'string' },
                  },
                },
                example: {
                  status: 'ok',
                  message: 'Connexion réussie ! Le backend TypeScript répond au frontend React.',
                },
              },
            },
          },
        },
      },
    },
  },
};
