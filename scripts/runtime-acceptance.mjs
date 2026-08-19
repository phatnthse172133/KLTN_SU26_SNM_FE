import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src');

// Import production code
import {
  safeJsonParse,
  serializeBody,
  buildAuthHeaders,
  DEFAULT_TIMEOUT_MS,
} from '../src/infrastructure/api/apiInternals.mjs';
import { createRequest } from '../src/infrastructure/api/requestCore.mjs';
import {
  mapApiError,
  mapTimeoutError,
  mapNetworkError,
  createAppError,
} from '../src/shared/errors/errorMapper.mjs';
import { errorMessages } from '../src/shared/errors/errorMessages.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ─── Helper: read production errorMessages.mjs ───
function readProductionErrorMessages() {
  const content = readFileSync(join(SRC_DIR, 'shared', 'errors', 'errorMessages.mjs'), 'utf8');
  const match = content.match(/INVALID_CREDENTIALS:\s*"([^"]+)"/);
  if (!match) throw new Error('INVALID_CREDENTIALS not found in errorMessages.mjs');
  return match[1];
}

// ─── Helper: read production ConfirmDialog.tsx ───
function readConfirmDialog() {
  return readFileSync(join(SRC_DIR, 'presentation', 'components', 'shared', 'ConfirmDialog.tsx'), 'utf8');
}

// ─── Helper: create a request instance with mock fetch ───
function createTestRequest(fetchFn, opts = {}) {
  return createRequest({
    fetchFn,
    baseUrl: 'http://localhost/api',
    timeoutMs: opts.timeoutMs ?? 50,
    safeJsonParse,
    buildAuthHeaders,
    mapApiError,
    mapTimeoutError,
    mapNetworkError,
    createAppError,
    errorMessages,
    getToken: opts.getToken ?? (() => null),
    onUnauthorized: opts.onUnauthorized,
  });
}

// ─── Helper: mock fetch that responds after delay ───
function delayedFetch(response, delay = 200) {
  return (url, init) => new Promise((resolve, reject) => {
    if (init?.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    if (init?.signal) {
      init.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
    setTimeout(() => resolve(response), delay);
  });
}

// ─── Helper: mock fetch that throws TypeError (network error) ───
function networkErrorFetch() {
  return () => Promise.reject(new TypeError('Failed to fetch'));
}

// ═══════════════════════════════════════════════════════
// 1. Request pipeline: timeout classification
// ═══════════════════════════════════════════════════════

console.log('\n=== 1. Request pipeline: timeout classification ===');

test('DEFAULT_TIMEOUT_MS is 30000 in production', () => {
  assert.equal(DEFAULT_TIMEOUT_MS, 30000, 'Production timeout should be 30 seconds');
});

await asyncTest('createRequest: timeout produces timeout error (not generic)', async () => {
  const request = createTestRequest(delayedFetch(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })));
  try {
    await request('/test', { method: 'GET' });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.message, errorMessages.timeout, 'Timeout should map to timeout error message');
    assert.equal(err.retryable, true, 'Timeout error should be retryable');
  }
});

await asyncTest('createRequest: external abort produces generic error (not timeout)', async () => {
  const controller = new AbortController();
  const request = createTestRequest(delayedFetch(new Response('{}', { status: 200 })));
  setTimeout(() => controller.abort(), 20);

  try {
    await request('/test', { method: 'GET', signal: controller.signal });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.message, errorMessages.generic, 'External abort should map to generic error, not timeout');
    assert.equal(err.retryable, false, 'External abort should not be retryable');
  }
});

await asyncTest('createRequest: pre-aborted signal produces generic error immediately', async () => {
  const controller = new AbortController();
  controller.abort();
  const request = createTestRequest(delayedFetch(new Response('{}', { status: 200 })));

  try {
    await request('/test', { method: 'GET', signal: controller.signal });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.message, errorMessages.generic, 'Pre-aborted signal should produce generic error');
  }
});

// ═══════════════════════════════════════════════════════
// 2. Request pipeline: FormData / Content-Type headers
// ═══════════════════════════════════════════════════════

console.log('\n=== 2. Request pipeline: FormData / Content-Type headers ===');

await asyncTest('createRequest: FormData body does not get Content-Type', async () => {
  let capturedHeaders = null;
  const fetchFn = (url, init) => {
    capturedHeaders = init.headers;
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  };

  const request = createTestRequest(fetchFn);
  const fd = new FormData();
  fd.append('file', 'test');
  await request('/upload', { method: 'POST', body: fd });

  assert.ok(capturedHeaders instanceof Headers, 'Headers should be a Headers instance');
  assert.ok(!capturedHeaders.has('Content-Type'), 'Content-Type should not be set for FormData');
});

await asyncTest('createRequest: JSON body gets Content-Type application/json', async () => {
  let capturedHeaders = null;
  const fetchFn = (url, init) => {
    capturedHeaders = init.headers;
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  };

  const request = createTestRequest(fetchFn);
  await request('/test', { method: 'POST', body: '{"key":"value"}' });

  assert.ok(capturedHeaders instanceof Headers, 'Headers should be a Headers instance');
  assert.equal(capturedHeaders.get('Content-Type'), 'application/json', 'Content-Type should be application/json for JSON body');
});

await asyncTest('createRequest: caller lowercase content-type is preserved (no duplicate)', async () => {
  let capturedHeaders = null;
  const fetchFn = (url, init) => {
    capturedHeaders = init.headers;
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  };

  const request = createTestRequest(fetchFn);
  await request('/test', { method: 'POST', body: '{"key":"value"}', headers: { 'content-type': 'text/plain' } });

  assert.equal(capturedHeaders.get('Content-Type'), 'text/plain', 'Should preserve caller content-type, not duplicate');
});

await asyncTest('createRequest: token sets Authorization header', async () => {
  let capturedHeaders = null;
  const fetchFn = (url, init) => {
    capturedHeaders = init.headers;
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  };

  const request = createTestRequest(fetchFn, { getToken: () => 'my-token' });
  await request('/test', { method: 'GET' });

  assert.equal(capturedHeaders.get('Authorization'), 'Bearer my-token', 'Should set Bearer token');
});

// ═══════════════════════════════════════════════════════
// 3. Request pipeline: handleResponse - malformed JSON
// ═══════════════════════════════════════════════════════

console.log('\n=== 3. Request pipeline: handleResponse - malformed JSON ===');

await asyncTest('createRequest: malformed JSON on success throws generic error', async () => {
  const fetchFn = () => Promise.resolve(new Response('{ invalid json }', { status: 200, headers: { 'content-type': 'application/json' } }));
  const request = createTestRequest(fetchFn);

  try {
    await request('/test', { method: 'GET' });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.message, errorMessages.generic, 'Malformed JSON on success should produce generic error');
  }
});

await asyncTest('createRequest: valid JSON on success returns parsed value', async () => {
  const fetchFn = () => Promise.resolve(new Response('{"id":42,"name":"test"}', { status: 200, headers: { 'content-type': 'application/json' } }));
  const request = createTestRequest(fetchFn);

  const result = await request('/test', { method: 'GET' });
  assert.equal(result.id, 42, 'Should return parsed JSON object');
  assert.equal(result.name, 'test', 'Should preserve all fields');
});

await asyncTest('createRequest: 204 No Content returns undefined', async () => {
  const fetchFn = () => Promise.resolve(new Response(null, { status: 204 }));
  const request = createTestRequest(fetchFn);

  const result = await request('/test', { method: 'DELETE' });
  assert.equal(result, undefined, '204 should return undefined');
});

await asyncTest('createRequest: non-JSON response returns raw text', async () => {
  const fetchFn = () => Promise.resolve(new Response('plain text', { status: 200, headers: { 'content-type': 'text/plain' } }));
  const request = createTestRequest(fetchFn);

  const result = await request('/test', { method: 'GET' });
  assert.equal(result, 'plain text', 'Non-JSON response should return raw text');
});

// ═══════════════════════════════════════════════════════
// 4. Request pipeline: network error and API error mapping
// ═══════════════════════════════════════════════════════

console.log('\n=== 4. Request pipeline: network error and API error mapping ===');

await asyncTest('createRequest: network error (TypeError) maps to network error message', async () => {
  const request = createTestRequest(networkErrorFetch());

  try {
    await request('/test', { method: 'GET' });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.message, errorMessages.network, 'Network error should map to network error message');
    assert.equal(err.retryable, true, 'Network error should be retryable');
  }
});

await asyncTest('createRequest: 400 API error with errorCode maps to business message', async () => {
  const fetchFn = () => Promise.resolve(new Response(
    JSON.stringify({ data: { errorCode: 'INVALID_CREDENTIALS' } }),
    { status: 400, headers: { 'content-type': 'application/json' } }
  ));
  const request = createTestRequest(fetchFn);

  try {
    await request('/test', { method: 'POST', body: '{}' });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.match(err.message, /incorrect email or password/i, 'INVALID_CREDENTIALS should map to credentials message');
    assert.equal(err.code, 'INVALID_CREDENTIALS', 'Error should preserve errorCode');
  }
});

await asyncTest('createRequest: 401 triggers onUnauthorized callback', async () => {
  let unauthorizedCalled = false;
  const fetchFn = () => Promise.resolve(new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } }));
  const request = createTestRequest(fetchFn, { onUnauthorized: () => { unauthorizedCalled = true; } });

  try {
    await request('/test', { method: 'GET' });
    assert.fail('Should have thrown');
  } catch {
    assert.ok(unauthorizedCalled, 'onUnauthorized should be called on 401');
  }
});

await asyncTest('createRequest: 500 maps to generic 500 message', async () => {
  const fetchFn = () => Promise.resolve(new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } }));
  const request = createTestRequest(fetchFn);

  try {
    await request('/test', { method: 'GET' });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.status, 500, 'Error should preserve status code');
  }
});

// ═══════════════════════════════════════════════════════
// 5. Production helpers: safeJsonParse, serializeBody, buildAuthHeaders
// ═══════════════════════════════════════════════════════

console.log('\n=== 5. Production helpers: safeJsonParse, serializeBody, buildAuthHeaders ===');

test('serializeBody returns FormData as-is (production function)', () => {
  const fd = new FormData();
  fd.append('file', 'test-content');
  const result = serializeBody(fd);
  assert.ok(result instanceof FormData, 'Should return FormData instance');
  assert.equal(result.get('file'), 'test-content', 'File field preserved');
});

test('serializeBody JSON.stringifies non-FormData (production function)', () => {
  const result = serializeBody({ name: 'test', value: 123 });
  assert.equal(result, '{"name":"test","value":123}', 'Should JSON.stringify non-FormData body');
});

test('buildAuthHeaders sets Authorization when token present', () => {
  const headers = buildAuthHeaders(undefined, 'my-token');
  assert.equal(headers.get('Authorization'), 'Bearer my-token');
});

test('buildAuthHeaders does not override existing Authorization', () => {
  const headers = buildAuthHeaders({ Authorization: 'Custom Auth' }, 'my-token');
  assert.equal(headers.get('Authorization'), 'Custom Auth');
});

test('safeJsonParse returns { success: false } for malformed JSON', () => {
  assert.equal(safeJsonParse('{ invalid }').success, false);
});

test('safeJsonParse returns { success: false } for empty string', () => {
  assert.equal(safeJsonParse('').success, false);
});

test('safeJsonParse handles objects correctly', () => {
  const result = safeJsonParse('{"message":"hello"}');
  assert.equal(result.success, true);
  assert.equal(result.value.message, 'hello');
});

// ═══════════════════════════════════════════════════════
// 6. INVALID_CREDENTIALS → English message (production file)
// ═══════════════════════════════════════════════════════

console.log('\n=== 6. INVALID_CREDENTIALS → English message (production file) ===');

test('errorMessages.mjs maps INVALID_CREDENTIALS to English message', () => {
  const msg = readProductionErrorMessages();
  assert.ok(msg, 'INVALID_CREDENTIALS should have a mapped message');
  assert.ok(!/[\u00C0-\u1FFF]/.test(msg), 'Message should not contain Vietnamese characters');
  assert.match(msg, /incorrect email or password/i, 'Message should mention incorrect credentials');
});

// ═══════════════════════════════════════════════════════
// 7. Static acceptance: ConfirmDialog focus + Escape effects
//    (Manual acceptance: Toast auto-dismiss, focus restoration in browser)
// ═══════════════════════════════════════════════════════

console.log('\n=== 7. Static acceptance: ConfirmDialog (manual: Toast, focus in browser) ===');

test('ConfirmDialog has separate useEffect for focus save/restore', () => {
  const content = readConfirmDialog();
  assert.ok(content.includes('previousActiveRef.current = document.activeElement'), 'Should save previous active element');
  assert.ok(content.includes('previousActiveRef.current?.focus()'), 'Should restore focus on cleanup');
  const focusIdx = content.indexOf('previousActiveRef.current = document.activeElement');
  const afterFocus = content.slice(focusIdx, focusIdx + 200);
  assert.ok(afterFocus.includes('}, [open])'), 'Focus effect should depend only on [open]');
});

test('ConfirmDialog focus effect does NOT depend on loading or onCancel', () => {
  const content = readConfirmDialog();
  const focusEffectStart = content.indexOf('previousActiveRef.current = document.activeElement');
  assert.ok(focusEffectStart > -1, 'Should reference previousActiveRef');
  const afterFocus = content.slice(focusEffectStart, focusEffectStart + 300);
  const depMatch = afterFocus.match(/\},\s*\[([^\]]+)\]\)/);
  assert.ok(depMatch, 'Focus effect should have a dependency array');
  const deps = depMatch[1].split(',').map(s => s.trim());
  assert.ok(deps.includes('open'), 'Focus effect should depend on open');
  assert.ok(!deps.includes('loading'), 'Focus effect should NOT depend on loading');
  assert.ok(!deps.includes('onCancel'), 'Focus effect should NOT depend on onCancel');
});

test('ConfirmDialog Escape effect depends on open, loading, and onCancel', () => {
  const content = readConfirmDialog();
  assert.ok(content.includes('Escape'), 'Should handle Escape key');
  assert.ok(content.includes('handleKeyDown'), 'Should have handleKeyDown function');
  const escapeIdx = content.indexOf('handleKeyDown');
  const afterEscape = content.slice(escapeIdx, escapeIdx + 400);
  assert.ok(afterEscape.includes('[open, loading, onCancel]'), 'Escape effect should depend on [open, loading, onCancel]');
});

// ─── Summary ───

console.log(`\n${'='.repeat(50)}`);
console.log(`Contract acceptance: ${passed}/${passed + failed} tests passed.`);
if (failed > 0) {
  console.error(`${failed} test(s) FAILED.`);
  process.exit(1);
} else {
  console.log('All contract acceptance tests passed.');
  process.exit(0);
}
