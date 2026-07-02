# Running Tests

## All tests

```bash
npm test
```

## By priority tag

```bash
npm run test:critical
npm run test:high
npm run test:medium
```

## A single file

```bash
npx playwright test QA_TASK/tests/critical-happy-path.spec.ts
```

## Headed mode

Opens a visible browser window so you can watch the test interact with the page:

```bash
npx playwright test --headed
```

## UI mode

An interactive interface with step-by-step execution, timeline, and DOM snapshots:

```bash
npx playwright test --ui
```

## List tests

List tests without running them — handy to verify tag filtering:

```bash
npx playwright test --list
npx playwright test --grep @critical --list
```

## View the report

After every run, Playwright generates an HTML report:

```bash
npx playwright show-report
```

This launches a local server and opens the report with detailed results, screenshots on failure, and trace files.
