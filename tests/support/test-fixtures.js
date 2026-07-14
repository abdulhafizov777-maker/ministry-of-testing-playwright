const { test: base, expect } = require('@playwright/test');

const SECRET_NAME = /authorization|cookie|password|passwd|token|secret|api[-_]?key|session/i;

function redact(value, key = '') {
  if (SECRET_NAME.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  }
  return value;
}

function redactText(value) {
  return String(value).replace(
    /(authorization|cookie|password|passwd|token|secret|api[-_]?key|session)(\s*[=:]\s*)([^&\s,;]+)/gi,
    '$1$2[REDACTED]'
  );
}

function redactUrl(value) {
  return String(value).replace(/([?&])([^=&]+)=([^&#]*)/g, (match, separator, name, item) =>
    `${separator}${name}=${SECRET_NAME.test(name) ? '[REDACTED]' : item}`
  );
}

function readableBody(value, contentType = '') {
  if (value === undefined || value === null || value === '') return 'No request body';
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : typeof value === 'string' ? value : JSON.stringify(value);
  if (!text) return 'No response body';
  if (/json/i.test(contentType) || /^[\s]*[\[{]/.test(text)) {
    try {
      return JSON.stringify(redact(JSON.parse(text)), null, 2);
    } catch {
      return redactText(text);
    }
  }
  return redactText(text);
}

async function attach(testInfo, name, body, contentType = 'text/plain') {
  await testInfo.attach(name, { body: Buffer.from(String(body)), contentType });
}

async function attachRequest(testInfo, method, url, headers, body) {
  await attach(testInfo, 'Request', `${method} ${redactUrl(url)}`);
  await attach(testInfo, 'Request Headers', JSON.stringify(redact(headers || {}), null, 2), 'application/json');
  await attach(testInfo, 'Request Body', body === undefined ? 'No request body' : readableBody(redact(body)));
}

async function attachResponse(testInfo, response, fallbackUrl) {
  if (!response) {
    await attach(testInfo, 'Response', `No response received for ${fallbackUrl}`);
    await attach(testInfo, 'Response Headers', '{}', 'application/json');
    await attach(testInfo, 'Response Body', 'No response body');
    return;
  }
  const headers = await response.headers();
  let body;
  try {
    body = await response.body();
  } catch {
    body = null;
  }
  await attach(testInfo, 'Response', `${response.status()} ${response.statusText()}\n${redactUrl(response.url())}`);
  await attach(testInfo, 'Response Headers', JSON.stringify(redact(headers), null, 2), 'application/json');
  await attach(testInfo, 'Response Body', body && body.length ? readableBody(body, headers['content-type']) : 'No response body');
}

function attachedRequestContext(context, testInfo) {
  const methods = new Set(['fetch', 'get', 'post', 'put', 'patch', 'delete', 'head']);
  return new Proxy(context, {
    get(target, property) {
      const original = target[property];
      if (!methods.has(property) || typeof original !== 'function') return typeof original === 'function' ? original.bind(target) : original;
      return async (url, options = {}) => {
        const method = property === 'fetch' ? (options.method || 'GET').toUpperCase() : property.toUpperCase();
        const body = options.data ?? options.form ?? options.multipart;
        await attachRequest(testInfo, method, String(url), options.headers, body);
        try {
          const response = await original.call(target, url, options);
          await attachResponse(testInfo, response, String(url));
          return response;
        } catch (error) {
          await attachResponse(testInfo, null, String(url));
          throw error;
        }
      };
    },
  });
}

const test = base.extend({
  request: async ({ request }, use, testInfo) => {
    await use(attachedRequestContext(request, testInfo));
  },
  page: async ({ page }, use, testInfo) => {
    const pending = [];
    page.on('request', (request) => {
      if (request.resourceType() !== 'document') return;
      pending.push((async () => {
        await attachRequest(testInfo, request.method(), request.url(), await request.allHeaders(), request.postData());
      })());
    });
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'document') return;
      pending.push(attachResponse(testInfo, response, response.url()));
    });
    await use(page);
    await Promise.allSettled(pending);
  },
});

module.exports = { test, expect };
