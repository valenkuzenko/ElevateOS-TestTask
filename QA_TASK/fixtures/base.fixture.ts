import { test as base } from '@playwright/test';
import { RegistrationPage } from '../page-objects/registration.page';

export const test = base.extend<{ registrationPage: RegistrationPage }>({
  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.navigate();
    await use(registrationPage);
  },
});

export { expect } from '@playwright/test';
