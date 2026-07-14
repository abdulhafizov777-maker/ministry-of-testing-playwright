# Ministry of Testing Playwright smoke tests

JavaScript smoke-test project with a deterministic 461-test suite for the public, non-destructive functionality at [Ministry of Testing](https://www.ministryoftesting.com/). It uses `@playwright/test`, runs Chromium with a single worker, and does not register users, sign in, submit forms, create content, make payments, or modify data.

## Live-site inspection and scope

The site was inspected before implementation on 13 July 2026. The visible primary navigation and actual public hrefs observed were:

| Label | Public route |
| --- | --- |
| Learn | `/learn` |
| Events | `/events` |
| Insights | `/trends` |
| Certs | `/certifications` |
| Observatory | `/observatory` |
| Moments | `/moments` |
| Join | `/membership` |
| Sign In | `/signin?return_to_referer=yes` |

No documented public JSON API was identified. Therefore, the `tests/api` suite uses Playwright's `request` fixture as an API/HTTP layer and sends only public `GET` requests to the real page routes. It never guesses or calls private endpoints and never sends `POST`, `PUT`, `PATCH`, or `DELETE` requests.

Because this is a live public site, content-card titles and event schedules can change. Navigation routes are centralized in `utils/routes.js`; update the inspected route map if the site changes its information architecture.

## Project structure

```text
tests/
  ui/
    homepage.spec.js
  api/
    public-pages.spec.js
pages/
  HomePage.js
utils/
  routes.js
  networkBridge.js
playwright.config.js
.env.example
README.md
package.json
package-lock.json
.gitignore
```

## Prerequisites and installation

- Node.js 18 or newer
- npm

Install dependencies and Chromium:

```bash
npm install
npx playwright install chromium
```

Optionally create a local `.env` from `.env.example`. The configuration defaults to the production public URL when `.env` is absent:

```dotenv
BASE_URL=https://www.ministryoftesting.com
USE_NETWORK_BRIDGE=false
```

Do not put credentials or secrets in `.env`; none are needed by this project. `.env` is gitignored.

## Run the tests

```bash
npm test              # all UI and HTTP tests
npm run test:ui       # UI smoke tests only
npm run test:api      # public GET checks only
npm run test:headed   # UI tests with a visible browser
npm run test:debug    # UI tests in Playwright debug mode
npm run test:allure   # run all tests and write Allure results
npm run report        # open the latest HTML report
```

The configuration deliberately fixes `workers: 1` to limit traffic to the public website. Line, HTML, and Allure reporters are enabled. Screenshots are saved only for failures; videos and traces are retained only when a test fails. Failure artifacts are written under `test-results/`, the Playwright report is written to `playwright-report/`, and raw Allure results are written to `allure-results/`.

The complete suite contains exactly 461 tests.

## Allure reports

Run the tests and generate the local Allure HTML report:

```bash
npm run test:allure
npm run allure:generate
npm run allure:open
```

`allure:generate` replaces `allure-report/` with a report built from `allure-results/`. Both generated directories are gitignored.

On every push to `main`, and when started manually, the GitHub Actions workflow runs the full Playwright suite, generates Allure even when tests fail, and deploys the report with GitHub Pages. The published report URL is:

https://abdulhafizov777-maker.github.io/ministry-of-testing-playwright/

### Optional network bridge

The custom network bridge is disabled by default, so UI tests normally exercise direct Chromium navigation. Some restricted CI or sandbox environments allow Playwright's request context to reach the internet while blocking browser-process connections. In that specific situation, opt in with:

```dotenv
USE_NETWORK_BRIDGE=true
```

When enabled, the bridge fetches current same-origin HTML through Playwright's request context and renders it in Chromium. It blocks subresources, third-party traffic, and all non-GET browser requests. This fallback is useful for validating server-rendered headings and links, but it does not exercise client-side JavaScript or asset loading and should not replace normal browser navigation in standard environments. The homepage document is fetched once per UI worker with at most one retry after a transport timeout.

## Coverage

The UI suite verifies homepage availability and title, the main header/navigation, all observed primary navigation destinations, visible main content, search opening, an event detail, an insight detail, Join and Sign In pages without submission, navigation-link HTTP health, and a mobile viewport smoke check. Every test creates its own isolated browser context.

The HTTP suite validates a `200` HTML homepage with a non-empty body and checks that all inspected major public routes return a status below `400`, using GET requests only.

## Responsible-use notes

- Keep `workers: 1` when targeting the production site.
- Run the suite reasonably; it is smoke coverage, not load or performance testing.
- Tests are read-only and public. Do not extend them with account creation, credential submission, payments, posting, or destructive actions.
- A live-site redesign or content refresh may require locator/route updates. Prefer accessible roles, labels, and visible names when maintaining tests.
