# ElevateOS — Registration Form Tests

End-to-end tests for the ElevateOS registration form, built with Playwright.

## What We Test

Tests are split by priority using tags:

| Tag | Coverage | File |
|-----|----------|------|
| `@critical` | Successful registration, required field validation | `critical-positive.spec.ts`, `field-validation.spec.ts` |
| `@high` | Email format, password mismatch, minimum length | `field-validation.spec.ts` |
| `@medium` | Avatar upload — file size and type rejection | `avatar-upload.spec.ts` |

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ElevateOS
```

### 2. Install dependencies

This pulls in Playwright, Faker, and other packages defined in `package.json`:

```bash
npm install
```

### 3. Install the browser

Playwright needs a real browser binary to run tests. This downloads Chromium along with its system-level dependencies (fonts, graphics libraries, etc.):

```bash
npx playwright install --with-deps chromium
```

### 4. Run the tests

All tests at once:

```bash
npm test
```

By priority tag — useful when you only want to verify a specific level:

```bash
npm run test:critical
npm run test:high
npm run test:medium
```

A single file:

```bash
npx playwright test tests/critical-positive.spec.ts
```

### 5. View the report

After every run, Playwright generates an HTML report. Open it in your browser:

```bash
npx playwright show-report
```

This launches a local server and opens the report with detailed results, screenshots on failure, and trace files.

## Other Ways to Run

**Headed mode** — opens a visible browser window so you can watch the test interact with the page:

```bash
npx playwright test --headed
```

**UI mode** — an interactive interface with step-by-step execution, timeline, and DOM snapshots:

```bash
npx playwright test --ui
```

**List tests** without running them — handy to verify tag filtering:

```bash
npx playwright test --list
npx playwright test --grep @critical --list
```

## Project Structure

```
tests/
├── fixtures/
│   ├── base.fixture.ts        # Shared fixture — provides registrationPage to every test
│   ├── user.fixture.ts        # Generates random user data using Faker
│   └── images/                # Test avatar files (valid, oversized, wrong type)
├── helpers/
│   ├── avatar-type.enum.ts    # Avatar type constants (Valid, InvalidSize, InvalidType)
│   └── error-messages.enum.ts # Expected error message strings
├── page-objects/
│   ├── registration.page.ts   # Page Object for the registration form
│   └── success.page.ts        # Page Object for the success confirmation page
├── critical-positive.spec.ts  # @critical — happy-path registration flow
├── field-validation.spec.ts   # @critical, @high — required fields and input validation
└── avatar-upload.spec.ts      # @medium — file upload edge cases
```

## CI/CD

The GitHub Actions pipeline runs tests sequentially — each level waits for the previous one to pass:

```
@critical  ──>  @high  ──>  @medium
 (always)     (if critical passes)  (scheduled only)
```

| Tag | When it runs | Condition |
|-----|-------------|-----------|
| `@critical` | every push / PR to `main` | always |
| `@high` | every push / PR to `main` | after `@critical` passes |
| `@medium` | weekdays at 06:00 UTC | after `@high` passes |

If `@critical` fails, everything else is skipped — fast feedback, no wasted CI minutes.

To trigger manually: **Actions → Playwright Tests → Run workflow** — pick a specific tag or `all`.

Reports are uploaded as artifacts and retained for 14 days.

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVS` | Base URL of the application under test | `https://qa-task.redvike.rocks/` |

To run against a different environment locally, create a `.env` file in the project root:

```
ENVS=https://staging.example.com/
```

This file is only used for local runs — CI uses its own environment variables.
