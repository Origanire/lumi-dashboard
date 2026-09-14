import { createApp } from './app.js';

const app = createApp();
app.listen(3001, '127.0.0.1', () => {
  console.log('Backend disponible sur http://127.0.0.1:3001');
});
