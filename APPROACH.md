# Approach & Framework Choice

## Why Playwright over Cypress / Selenium

| Feature | Playwright | Cypress | Selenium |
|---------|-----------|---------|----------|
| Auto-waiting | Built-in for every action and assertion — no manual `sleep()` or `waitForElement` | Partial — auto-retries assertions but not all actions | None — requires explicit waits everywhere |
| Multi-tab / multi-origin | Full support via browser contexts | Not supported — single-tab only | Requires manual window switching |
| File uploads | `setInputFiles()` — one line | `selectFile()` — works but limited | Complex — requires OS-level interaction |
| Network interception | `waitForResponse()`, `route()` — native | `cy.intercept()` — good but single-domain | Requires a proxy (BrowserMob) |
| Browser validation API | `page.evaluate()` gives direct access to `checkValidity()`, `ValidityState` | Possible but verbose | Possible but verbose |
| Parallelism | Built-in workers, isolated browser contexts | Paid feature (Cypress Cloud) or hacky workarounds | Requires Selenium Grid setup |
| `test.step()` | Native — groups actions in report without splitting tests | No equivalent | No equivalent |
| Tag-based filtering | `--grep @tag` — no plugins | `--env grepTags=@tag` — requires plugin | TestNG groups or JUnit tags — verbose config |
| Reporters | HTML with traces, screenshots, step tree — out of the box | Dashboard (paid) or Mochawesome (plugin) | Allure (plugin) or ExtentReports (plugin) |
| Retries | `retries: N` in config — with trace capture on first retry | `retries: N` — similar | No built-in retry mechanism |
| Speed | Fast — direct CDP connection, no network serialization | Fast for simple tests, slower for complex flows | Slowest — WebDriver protocol overhead |

For this project specifically, Playwright was the best fit because:
- **Slider interaction** required precise mouse control (`mouse.move` with `steps`) — Playwright's low-level mouse API made it possible without hacks
- **Two-layer validation testing** (browser + server) needed `page.evaluate()` to access the Constraint Validation API and swap input types at runtime
- **Parallel workers** with isolated contexts — 2 workers cut execution time in half with no shared state issues
- **No extra dependencies** — file uploads, network waiting, HTML reports, retries, tag filtering all work without plugins

## Key Design Decisions

### Page Object Model

Each page has a dedicated class (`RegistrationPage`, `SuccessPage`) that encapsulates locators and actions. Tests read like scenarios — `registerUser(user)`, `fillField('email', value)`, `slideToUnlock()` — without any CSS selectors or DOM logic leaking into spec files.

### Data generation with Faker

Every test generates a fresh random user via `randomUser()` using `@faker-js/faker`. This avoids:
- Hardcoded test data that could mask bugs (e.g., a specific email format always passing)
- Conflicts between parallel workers sharing the same data
- Flaky "duplicate user" errors on the server

### Slider unlock — strict comparison workaround

The registration form has a "slide to submit" captcha. The slider JS uses a **strict equality check** (`===`) to determine if the thumb reached the end. A simple drag to `trackWidth` often lands 1-2px short due to browser rounding, leaving the slider locked.

Solution in `slideToUnlock()`:
1. `scrollIntoViewIfNeeded()` — ensures bounding boxes are accurate after any page scroll
2. Start the drag 5px from the left edge of the thumb (not center) — guarantees `mousedown` hits the element
3. **Overshoot by 10px** past the track end — the slider JS clamps the position to max, which reliably triggers the `=== end` unlock condition
4. Use `steps: Math.max(distance, 20)` — generates ~1px per mousemove event, so the slider processes enough events to reach the exact end value

```ts
await this.page.mouse.move(startX + distance + 10, startY, {
  steps: Math.max(distance, 20),
});
```

Without the overshoot, test would fail (~15-20% of runs) because the final mouse position lands just before the threshold.

### Browser validation vs server validation

The form has two validation layers, and we test both explicitly:

**Browser validation** — HTML5 `required`, `type="email"`, etc. The browser blocks form submission before it reaches the server. We verify this using the Constraint Validation API:

```ts
await registrationPage.clickSubmit({ expectBrowserError: true });
expect(await registrationPage.isFieldValid('firstName')).toBe(false);
```

Under the hood, `isFieldValid()` calls `el.checkValidity()` and logs the browser's validation message. This gives us the exact reason (e.g., "Please include an '@' in the email address").

**Server validation** — to test server-side rules (invalid email format, password too short, password mismatch), we need to bypass the browser layer first. For the email test, we swap the input type from `email` to `text` at runtime:

```ts
await registrationPage.page.evaluate(() => {
  const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
  emailInput.type = 'text';
});
```

This lets `notanemail` pass browser validation and reach the server, where we assert the server's error message.

The `clickSubmit()` method handles both flows via flags:
- `{ expectBrowserError: true }` — clicks and returns without waiting for navigation
- `{ expectServerError: true }` — clicks and reads the error message from the DOM
- No flags — clicks and waits for a `/success` response

### Parameterized avatar tests

The application accepts `.jpg`, `.png`, `.jpeg`, `.gif`, and `.bmp` uploads. Initially, one test picked a random file from the `valid/` folder — this only caught format-specific bugs ~20% of the time.

I eventually replaced it with a parameterized loop that generates a separate test per file:

```ts
for (const { filePath, extension } of allValidAvatars()) {
  test(`@critical Successful submission with valid avatar (${extension})`, async ({ ... }) => {
```

Adding a new file to `fixtures/images/valid/` automatically creates a new test — no code changes needed. Custom assertion messages include the format and file path, so failures immediately show which format broke:

```
Error: Avatar image not displayed after uploading .gif file: .../valid/1.58 MB.gif
```

### `test.step()` for multi-phase tests

When a test has 3+ logical phases, we wrap them in `test.step()` instead of splitting into separate tests. Example — the empty required fields test submits the form 6 times, filling one field each time:

```ts
await test.step('Submit with all fields empty — firstName should be invalid', async () => { ... });
await test.step('Fill firstName, submit — lastName should be invalid', async () => { ... });
```

Benefits:
- Steps appear in the HTML report as a collapsible tree
- One test setup (navigate, generate user) serves all steps — faster execution
- The sequence matters (each step builds on the previous) — separate tests would lose that context

### Tag-based test prioritization

Tests are tagged in their names (`@critical`, `@high`, `@medium`) and filtered via `--grep`:

| Tag | Purpose | CI behavior |
|-----|---------|-------------|
| `@critical` | Core flows that must never break | Runs on every push/PR |
| `@high` | Important validation rules | Runs after critical passes |
| `@medium` | Edge cases (file uploads) | Scheduled runs only |

This keeps PR feedback fast (critical + high in ~15s) while still covering edge cases on a daily schedule.

### Error message enum

All expected server error messages live in `ErrorMessage` enum:

```ts
export enum ErrorMessage {
  InvalidEmail = 'Invalid email address!',
  PasswordsMismatch = 'Passwords do not match!',
  ...
}
```

If the server changes a message, one enum update fixes all tests. No magic strings scattered across spec files.

### Retries

Configured in `playwright.config.ts`:

```ts
retries: process.env.CI ? 2 : 0,
```

- **CI: 2 retries** — E2E tests hit real servers, so transient failures (network hiccups, slow responses) are inevitable. Retrying up to 2 times prevents false negatives from blocking the pipeline.
- **Locally: 0 retries** — when developing tests, you want immediate failure feedback. A flaky test should fail fast so you can fix it, not silently pass on retry.

Combined with `trace: "on-first-retry"` — Playwright records a full trace (DOM snapshots, network, console) only when a test fails and gets retried. This gives you detailed debugging data for flaky tests without the overhead of tracing every run.

### CI pipeline (sample)

The `.github/workflows/playwright.yml` is included as a **sample** to demonstrate tag-based pipeline design. It shows how tags translate into a sequential gate:

```
@critical  ──>  @high  ──>  @medium
 (always)    (if critical passes)  (scheduled only)
```

Key points:
- `needs:` creates dependencies between jobs — if `@critical` fails, `@high` and `@medium` are skipped
- `@medium` edge-case tests only run on schedule (weekdays 06:00 UTC) or manual dispatch — keeps PR checks fast
- `workflow_dispatch` with a tag dropdown allows manual runs of any level or all at once
- Each job uploads its HTML report as an artifact (retained 14 days)

## Known Issues

- **GIF upload bug** — the server accepts `.gif` files but does not display them on the success page. The `@critical Successful submission with valid avatar (.gif)` test correctly catches this. Reported — can be temporarily excluded from the valid formats list if needed.
