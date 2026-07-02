import { test, expect } from '../fixtures/base.fixture';
import { randomUser, allValidAvatars } from '../fixtures/user.fixture';

import { ErrorMessage } from '../helpers/error-messages.enum';
import { AvatarType } from '../helpers/avatar-type.enum';

test.describe('Avatar Upload Validation', () => {
  test.describe('Valid formats', () => {
    // GIF test will fail. reported. to avoid test failure, GIF can be temporary excluded from the valid formats list.
    for (const { filePath, extension } of allValidAvatars()) {
      test(`@medium Successful submission with valid avatar (${extension})`, async ({ registrationPage }) => {
        const user = randomUser();
        const successPage = await registrationPage.registerUser({ ...user, avatar: filePath, avatarExtension: extension });

        await expect(successPage.heading).toBeVisible();
        await expect(successPage.avatarImage, `Avatar image not displayed after uploading ${extension} file: ${filePath}`).toBeVisible({ timeout: 1000 });
        const uploadedExt = await successPage.getAvatarExtension();
        expect(uploadedExt, `Expected avatar extension to be ${extension}`).toBe(extension);
      });
    }
  });

  test.describe('Invalid files', () => {
    test.beforeEach(async ({ registrationPage }) => {
      const user = randomUser();
      await registrationPage.fillUserData(user);
      await registrationPage.solveSliderCaptcha();
    });

    test('@medium Invalid file size rejected', async ({ registrationPage }) => {
      const user = randomUser(AvatarType.InvalidSize);
      await registrationPage.uploadAvatar(user.avatar!);
      await registrationPage.clickSubmit({ expectServerError: true });

      await expect(registrationPage.errorMessage).toHaveText(ErrorMessage.FileSizeTooLarge);
    });

    test('@medium Invalid file type rejected', async ({ registrationPage }) => {
      const user = randomUser(AvatarType.InvalidType);
      await registrationPage.uploadAvatar(user.avatar!);
      await registrationPage.clickSubmit({ expectServerError: true });

      await expect(registrationPage.errorMessage).toHaveText(ErrorMessage.InvalidFileType);
    });
  });
});
