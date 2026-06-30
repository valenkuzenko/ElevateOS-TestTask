import { test, expect } from '../fixtures/base.fixture';
import { randomUser } from '../fixtures/user.fixture';

test.describe('Registration Form', () => {
  test('@critical Successful form submission with all valid required fields only', async ({ registrationPage }) => {
    const user = randomUser();
    const successPage = await registrationPage.registerUser(user);

    await expect(successPage.heading).toBeVisible();
    const submissionText = await successPage.getSubmissionText();
    expect(submissionText).toContain(`${user.firstName} ${user.lastName}`);
    expect(submissionText).toContain(user.email);
  });
});
