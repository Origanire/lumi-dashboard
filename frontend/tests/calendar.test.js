import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, buildEvent, eventsOnDay, localDate, period, eventMetadata } from '../src/widgets/calendar/calendarModel.js';
import { listEvents, calendarRequest } from '../src/widgets/calendar/calendarClient.js';

const draft = { title: 'Livraison', startDate: '2026-09-21', endDate: '2026-09-21', startTime: '09:00', endTime: '10:00', allDay: false, labels: 'backend, API, backend', priority: 'high', deadline: '2026-09-25', description: 'Revue', location: 'Marseille' };
test('month/year boundaries, Monday weeks and daylight-saving days use local dates', () => {
  const month = period(new Date(2026, 11, 31), 'month');
  assert.equal(localDate(month.start), '2026-12-01');
  assert.equal(localDate(month.end), '2027-01-01');
  assert.equal(localDate(period(new Date(2027, 0, 3), 'week').start), '2026-12-28');
  assert.equal(localDate(addDays(new Date(2026, 2, 29), 1)), '2026-03-30');
});
test('all-day end is exclusive and multiday events overlap only relevant days', () => {
  const body = buildEvent({ ...draft, allDay: true, endDate: '2026-09-23' });
  assert.deepEqual(body.end, { date: '2026-09-24' });
  assert.equal(eventsOnDay([body], new Date(2026, 8, 23)).length, 1);
  assert.equal(eventsOnDay([body], new Date(2026, 8, 24)).length, 0);
  const night = buildEvent({ ...draft, startTime: '23:00', endDate: '2026-09-22', endTime: '01:00' });
  assert.equal(eventsOnDay([night], new Date(2026, 8, 22)).length, 1);
});
test('priority, deduplicated labels and deadline round-trip via Google private properties', () => {
  const body = buildEvent(draft);
  assert.deepEqual(eventMetadata(body), { priority: 'high', labels: ['backend', 'API'], deadline: '2026-09-25' });
  assert.equal(eventMetadata({}).priority, 'normal');
  assert.equal(eventMetadata({ extendedProperties: { private: { lumiPriority: '__proto__' } } }).priority, 'normal');
});
test('invalid ranges and blank titles cannot be sent', () => {
  assert.throws(() => buildEvent({ ...draft, title: ' ' }));
  assert.throws(() => buildEvent({ ...draft, endTime: '08:00' }));
  assert.throws(() => buildEvent({ ...draft, allDay: true, endDate: '2026-09-20' }));
  assert.throws(() => buildEvent({ ...draft, labels: 'a'.repeat(201) }));
});
test('Paris spring clock change: nonexistent times rejected and timed duration preserved', () => {
  if (Intl.DateTimeFormat().resolvedOptions().timeZone !== 'Europe/Paris') return;
  assert.throws(() => buildEvent({ ...draft, startDate: '2026-03-29', endDate: '2026-03-29', startTime: '02:30', endTime: '04:00' }));
  const event = buildEvent({ ...draft, startDate: '2026-03-29', endDate: '2026-03-29', startTime: '01:30', endTime: '03:30' });
  assert.equal(+new Date(event.end.dateTime) - +new Date(event.start.dateTime), 3600000);
});
test('Google event pagination preserves range and ignores cancelled events', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: new URL(url), options });
    return Response.json(calls.length === 1 ? { items: [{ id: 'a' }], nextPageToken: 'next' } : { items: [{ id: 'b' }, { id: 'deleted', status: 'cancelled' }] });
  });
  const events = await listEvents('test-token', '2026-09-01T00:00:00Z', '2026-10-01T00:00:00Z');
  assert.deepEqual(events.map(e => e.id), ['a', 'b']);
  assert.equal(calls[1].url.searchParams.get('pageToken'), 'next');
  assert.equal(calls[1].url.searchParams.get('singleEvents'), 'true');
  assert.equal(calls[1].url.searchParams.get('timeMin'), '2026-09-01T00:00:00Z');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
});
test('expired authorization and quota errors remain actionable without exposing API details', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'private data' }, { status: 401 }));
  await assert.rejects(() => listEvents('test-token', 'start', 'end'), err => err.status === 401 && !err.message.includes('private data'));
});
test('creation posts metadata and never retries an ambiguous network failure', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).extendedProperties.private.lumiPriority, 'high');
    throw new TypeError('network');
  });
  await assert.rejects(() => calendarRequest('test-token', '', { body: buildEvent(draft) }), /vérifier si l’événement/);
  assert.equal(calls, 1);
});

test('403 distinguishes disabled API, missing consent and quota from structured Google reasons', async t => {
  const cases = [
    [{ errors: [{ reason: 'accessNotConfigured' }] }, 'SERVICE_DISABLED'],
    [{ details: [{ reason: 'SERVICE_DISABLED' }] }, 'SERVICE_DISABLED'],
    [{ errors: [{ reason: 'insufficientPermissions' }] }, 'ACCESS_TOKEN_SCOPE_INSUFFICIENT'],
    [{ details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] }, 'ACCESS_TOKEN_SCOPE_INSUFFICIENT'],
    [{ errors: [{ reason: 'userRateLimitExceeded' }] }, 'QUOTA_EXCEEDED'],
    [{ errors: [{ reason: 'quotaExceeded' }] }, 'QUOTA_EXCEEDED'],
  ];
  let payload;
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { ...payload, message: 'private upstream details' } }, { status: 403 }));
  for (const [value, expected] of cases) {
    payload = value;
    await assert.rejects(() => listEvents('test-token', 'start', 'end'), error =>
      error.status === 403 && error.message.includes(expected) && !error.message.includes('private upstream details'));
  }
});
test('non-JSON and malformed 403 errors preserve a safe fallback', async t => {
  let response = new Response('<html>private proxy details</html>', { status: 403 });
  t.mock.method(globalThis, 'fetch', async () => response);
  await assert.rejects(() => listEvents('test-token', 'start', 'end'), error => error.status === 403 && error.message.includes('Google refuse') && !error.message.includes('private'));
  response = Response.json({ error: { errors: [null], details: 'invalid' } }, { status: 403 });
  await assert.rejects(() => listEvents('test-token', 'start', 'end'), error => error.status === 403);
});
