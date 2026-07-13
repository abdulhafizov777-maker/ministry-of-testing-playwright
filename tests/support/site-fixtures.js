const SITE_ROUTES = Object.freeze([
  { name: 'Home', path: '/', h1: 'Welcome to the MoTaverse' },
  { name: 'Learn', path: '/learn', h1: 'On Demand Courses' },
  { name: 'Events', path: '/events', h1: 'Events' },
  { name: 'Insights', path: '/insights', h1: 'Insights' },
  { name: 'Certifications', path: '/certifications', h1: 'MoT Software Testing Certifications' },
  { name: 'Observatory', path: '/observatory', h1: 'The Observatory' },
  { name: 'Moments', path: '/moments', h1: 'Moments' },
  { name: 'Membership', path: '/membership', h1: 'Your career companion' },
  { name: 'Sign In', path: '/signin?return_to_referer=yes', h1: 'Nice to see you' },
]);

const PRIMARY_ROUTES = SITE_ROUTES.filter(({ name }) => name !== 'Sign In');
const responseCache = new Map();

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function textFromMatch(html, expression) {
  const match = html.match(expression);
  return match ? decodeEntities(match[1].replace(/<[^>]*>/g, ' ')) : '';
}

function attributeValues(html, tagName, attributeName) {
  const values = [];
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || [];
  const attribute = new RegExp(`\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  for (const tag of tags) {
    const match = tag.match(attribute);
    if (match) values.push(decodeEntities(match[2]));
  }
  return values;
}

function documentFacts(body) {
  return {
    title: textFromMatch(body, /<title[^>]*>([\s\S]*?)<\/title>/i),
    h1: textFromMatch(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    hrefs: attributeValues(body, 'a', 'href'),
    imageAlts: attributeValues(body, 'img', 'alt'),
    inputTypes: attributeValues(body, 'input', 'type').map((value) => value.toLowerCase()),
  };
}

async function fetchSnapshot(request, path, options = {}) {
  const key = JSON.stringify([path, options.maxRedirects ?? 'default']);
  if (!responseCache.has(key)) {
    responseCache.set(key, (async () => {
      const response = await request.get(path, {
        failOnStatusCode: false,
        ...options,
      });
      const body = await response.text();
      return {
        status: response.status(),
        url: response.url(),
        headers: response.headers(),
        body,
        facts: documentFacts(body),
      };
    })());
  }
  return responseCache.get(key);
}

function staticHtml(body) {
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s(?:src|srcset)\s*=\s*(["'])[^"']*\1/gi, '')
    .replace(/url\([^)]*\)/gi, 'none');
}

async function loadStaticDocument(page, request, path) {
  const snapshot = await fetchSnapshot(request, path);
  await page.setContent(staticHtml(snapshot.body), { waitUntil: 'domcontentloaded' });
  return snapshot;
}

module.exports = {
  SITE_ROUTES,
  PRIMARY_ROUTES,
  attributeValues,
  fetchSnapshot,
  loadStaticDocument,
  textFromMatch,
};
