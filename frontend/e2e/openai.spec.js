import { test, expect } from '@playwright/test';

async function mount(page, configured = true) {
  await page.route('**/api/ai/status', route => route.fulfill({ json: { configured } }));
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

test('OpenAI only sends on submit, renders text safely, and allows clearing', async ({ page }) => {
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
  await expect(page.getByLabel('Réponse OpenAI')).toContainText('<script>alert(1)</script> Une réponse');
  expect(requests).toEqual([{ prompt: 'Bonjour' }]);
  await page.getByRole('button', { name: 'Effacer l’échange' }).click();
  await expect(page.getByLabel('Votre demande')).toHaveValue('');
  await expect(page.getByLabel('Réponse OpenAI')).toHaveCount(0);
});

test('OpenAI explains missing configuration and preserves a prompt on API failure', async ({ page }) => {
  await mount(page, false);
  await expect(page.getByText('OpenAI n’est pas encore configuré', { exact: false })).toBeVisible();
  await page.getByLabel('Votre demande').fill('Bonjour');
  await expect(page.getByRole('button', { name: 'Envoyer la demande' })).toBeDisabled();
  await page.route('**/api/ai/ask', route => route.fulfill({ status: 429, json: { message: 'Quota atteint' } }));
  await mount(page, true);
  await page.getByLabel('Votre demande').fill('Bonjour');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await expect(page.getByRole('alert')).toHaveText('Quota atteint');
  await expect(page.getByLabel('Votre demande')).toHaveValue('Bonjour');
});
