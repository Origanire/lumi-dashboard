import { test, expect } from '@playwright/test';

async function mount(page, configured = true) {
  await page.route('**/api/ai/status', route => route.fulfill({ json: { configured, model: "qwen2.5:14b", message: "Le modèle local n’est pas encore téléchargé." } }));
  await page.goto('/');
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { default: Widget } = await import('/src/widgets/openai/OpenAIWidget.jsx');
    const host = document.createElement('div');
    document.body.append(host);
    createRoot(host).render(React.createElement(Widget));
  });
}

test('Local AI only sends on submit, renders text safely, and allows clearing', async ({ page }) => {
  const requests = [];
  await page.route('**/api/ai/ask', route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { text: '<script>alert(1)</script> Une réponse', incomplete: false } });
  });
  await mount(page);
  const send = page.getByRole('button', { name: 'Envoyer la demande' });
  await expect(send).toBeDisabled();
  await page.getByLabel('Votre demande').fill('  Bonjour  ');
  await expect(send).toBeEnabled();
  expect(requests).toEqual([]);
  await send.click();
  await expect(page.getByLabel('Réponse de l’assistant IA')).toContainText('<script>alert(1)</script> Une réponse');
  expect(requests).toEqual([{ prompt: 'Bonjour' }]);
  await page.getByRole('button', { name: 'Effacer l’échange' }).click();
  await expect(page.getByLabel('Votre demande')).toHaveValue('');
  await expect(page.getByLabel('Réponse de l’assistant IA')).toHaveCount(0);
});

test('Local AI explains missing model and preserves a prompt on API failure', async ({ page }) => {
  await mount(page, false);
  await expect(page.getByText('Le modèle local n’est pas encore téléchargé.', { exact: false })).toBeVisible();
  await page.getByLabel('Votre demande').fill('Bonjour');
  await expect(page.getByRole('button', { name: 'Envoyer la demande' })).toBeDisabled();
  await page.route('**/api/ai/ask', route => route.fulfill({ status: 429, json: { message: 'Quota atteint' } }));
  await mount(page, true);
  await page.getByLabel('Votre demande').fill('Bonjour');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await expect(page.getByRole('alert')).toHaveText('Quota atteint');
  await expect(page.getByLabel('Votre demande')).toHaveValue('Bonjour');
});


test('local model can become ready without reloading or losing the question', async ({ page }) => {
  await mount(page, false);
  await page.getByLabel('Votre demande').fill('Combien font 2 + 2 ?');
  await expect(page.getByRole('button', { name: 'Envoyer la demande' })).toBeDisabled();
  await page.route('**/api/ai/status', route => route.fulfill({ json: { configured: true, model: 'qwen2.5:14b' } }));
  await page.getByRole('button', { name: 'Vérifier le modèle' }).click();
  await expect(page.getByRole('button', { name: 'Envoyer la demande' })).toBeEnabled();
  await expect(page.getByLabel('Votre demande')).toHaveValue('Combien font 2 + 2 ?');
});
