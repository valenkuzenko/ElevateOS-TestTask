import { test, expect } from '../fixtures/base.fixture';
import { ErrorMessage } from '../helpers/error-messages.enum';
import { randomUser } from '../fixtures/user.fixture';
import { RegistrationUser } from '../page-objects/registration.page';

test.describe('Field Validation', () => {
  test('@critical Validation error when submitting with empty required fields', async ({ registrationPage }) => {
    const user = randomUser();
    await registrationPage.slideToUnlock();

    await test.step('Submit with all fields empty — firstName should be invalid', async () => {
      await registrationPage.clickSubmit({ expectBrowserError: true });
      expect(await registrationPage.isFieldValid('firstName')).toBe(false);
      const message = await registrationPage.getFieldValidationMessage('firstName');
      expect(message).toContain(ErrorMessage.BrowserRequired);
    });

    await test.step('Fill firstName, submit — lastName should be invalid', async () => {
      await registrationPage.fillField('firstName', user.firstName);
      await registrationPage.clickSubmit({ expectBrowserError: true });
      expect(await registrationPage.isFieldValid('lastName')).toBe(false);
      const message = await registrationPage.getFieldValidationMessage('lastName');
      expect(message).toContain(ErrorMessage.BrowserRequired);
    });

    await test.step('Fill lastName, submit — email should be invalid', async () => {
      await registrationPage.fillField('lastName', user.lastName);
      await registrationPage.clickSubmit({ expectBrowserError: true });
      expect(await registrationPage.isFieldValid('email')).toBe(false);
      const message = await registrationPage.getFieldValidationMessage('email');
      expect(message).toContain(ErrorMessage.BrowserRequired);
    });

    await test.step('Fill email, submit — password should be invalid', async () => {
      await registrationPage.fillField('email', user.email);
      await registrationPage.clickSubmit({ expectBrowserError: true });
      expect(await registrationPage.isFieldValid('password')).toBe(false);
      const message = await registrationPage.getFieldValidationMessage('password');
      expect(message).toContain(ErrorMessage.BrowserRequired);
    });

    await test.step('Fill password, submit — confirmPassword should be invalid', async () => {
      await registrationPage.fillField('password', user.password);
      await registrationPage.clickSubmit({ expectBrowserError: true });
      expect(await registrationPage.isFieldValid('confirmPassword')).toBe(false);
      const message = await registrationPage.getFieldValidationMessage('confirmPassword');
      expect(message).toContain(ErrorMessage.BrowserRequired);
    });

    await test.step('Fill confirmPassword, submit — all fields pass browser validation', async () => {
      await registrationPage.fillField('confirmPassword', user.confirmPassword);
      await registrationPage.clickSubmit();
    });
  });

  test.describe('Input rules', () => {
    let user: RegistrationUser;

    test.beforeEach(async ({ registrationPage }) => {
      user = randomUser();
      await registrationPage.fillField('firstName', user.firstName);
      await registrationPage.fillField('lastName', user.lastName);
      await registrationPage.slideToUnlock();
    });

    test('@high Validation error for invalid email format', async ({ registrationPage }) => {
      await test.step('Browser validation — email without @ is rejected', async () => {
        await registrationPage.fillField('email', 'notanemail');
        await registrationPage.fillField('password', user.password);
        await registrationPage.fillField('confirmPassword', user.confirmPassword);

        const validity = await registrationPage.getFieldValidityState('email');
        expect(validity.typeMismatch).toBe(true);

        const message = await registrationPage.getFieldValidationMessage('email');
        console.log(`[Validation] Email browser validation message: "${message}"`);
        expect(message).toContain(ErrorMessage.BrowserEmailMissingAt);
      });

      await test.step('Browser validation — email with @ but no domain is rejected', async () => {
        await registrationPage.fillField('email', 'notanemail@');

        const validity = await registrationPage.getFieldValidityState('email');
        expect(validity.typeMismatch).toBe(true);

        const message = await registrationPage.getFieldValidationMessage('email');
        console.log(`[Validation] Email browser validation message: "${message}"`);
        expect(message).toContain(ErrorMessage.BrowserEmailMissingDomain);
      });

      await test.step('Server validation — invalid email rejected', async () => {
        // Bypass browser-level email validation to test server-side
        await registrationPage.page.evaluate(() => {
          const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
          emailInput.type = 'text';
        });
        await registrationPage.fillField('email', 'notanemail');

        await registrationPage.clickSubmit({ expectServerError: true });

        await expect(registrationPage.errorMessage).toHaveText(ErrorMessage.InvalidEmail);
      });
    });

    test('@high Validation error when Password and Confirm Password do not match', async ({ registrationPage }) => {
      await registrationPage.fillField('email', user.email);
      await registrationPage.fillField('password', user.password);
      await registrationPage.fillField('confirmPassword', 'different_password');

      await registrationPage.clickSubmit({ expectServerError: true });

      await expect(registrationPage.errorMessage).toHaveText(ErrorMessage.PasswordsMismatch);
    });

    test('@high Validation for password minimum length', async ({ registrationPage }) => {
      const shortPassword = '1234567';

      await registrationPage.fillField('email', user.email);
      await registrationPage.fillField('password', shortPassword);
      await registrationPage.fillField('confirmPassword', shortPassword);

      await registrationPage.clickSubmit({ expectServerError: true });

      await expect(registrationPage.errorMessage).toHaveText(ErrorMessage.PasswordTooShort);
    });
  });
});
