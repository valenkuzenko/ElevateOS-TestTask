import { Locator, Page } from '@playwright/test';
import { SuccessPage } from './success.page';

export type RegistrationFieldNames = | 'firstName'| 'lastName'| 'email'| 'password'| 'confirmPassword'

export type RegistrationUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
  avatarExtension?: string;
};

export class RegistrationPage {
  readonly page: Page;
  readonly fieldLocators: Record<RegistrationFieldNames, Locator>;
  readonly submitButton: Locator;
  readonly sliderCaptchaTrack: Locator;
  readonly sliderCaptchaThumb: Locator;
  readonly avatarUploadInput: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fieldLocators = {
      firstName: page.locator('input[name="first_name"]'),
      lastName: page.locator('input[name="last_name"]'),
      email: page.locator('input[name="email"]'),
      password: page.locator('input[name="password"]'),
      confirmPassword: page.locator('input[name="confirm_password"]'),
    };
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.sliderCaptchaTrack = page.locator('#slider-track');
    this.sliderCaptchaThumb = page.locator('#slider-thumb');
    this.avatarUploadInput = page.locator('input[type="file"]');
    this.errorMessage = page.locator('ul > li');
  }

  async navigate() {
    console.log('[Navigate] Opening registration page');
    await this.page.goto('/');
  }

  async fillField(field: RegistrationFieldNames, value: string) {
    const input = this.fieldLocators[field];
    console.log(`[Fill] ${field}: "${value}"`);
    await input.fill(value);
  }

  async fillUserData(user: RegistrationUser) {
    await this.fillField('firstName', user.firstName);
    await this.fillField('lastName', user.lastName);
    await this.fillField('email', user.email);
    await this.fillField('password', user.password);
    await this.fillField('confirmPassword', user.confirmPassword);
    if (user.avatar) {
      await this.uploadAvatar(user.avatar);
    }
  }

  async solveSliderCaptcha() {
    const { startX, startY, distance } = await this.getSliderCaptchaPositions();
    await this.grabSliderCaptchaThumb(startX, startY);
    await this.dragSliderCaptchaThumbToEnd(startX, startY, distance);
    await this.releaseSliderCaptchaThumb();
  }

  private async getSliderCaptchaPositions() {
    await this.sliderCaptchaThumb.scrollIntoViewIfNeeded();
    const thumbBox = await this.sliderCaptchaThumb.boundingBox();
    const trackBox = await this.sliderCaptchaTrack.boundingBox();
    if (!trackBox || !thumbBox) {
      throw new Error('Slider captcha elements not found on the page');
    }
    return {
      startX: thumbBox.x + 5,
      startY: thumbBox.y + thumbBox.height / 2,
      distance: trackBox.width - thumbBox.width,
    };
  }

  private async grabSliderCaptchaThumb(x: number, y: number) {
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
  }

  private async dragSliderCaptchaThumbToEnd(startX: number, startY: number, distance: number) {
    // Overshoot by 10px — the slider JS clamps position to max, triggering the === end unlock check.
    // Use ~1px per step (min 20) so the mousemove events reliably hit the exact end value.
    await this.page.mouse.move(startX + distance + 10, startY, { steps: Math.max(distance, 20) });
  }

  private async releaseSliderCaptchaThumb() {
    await this.page.mouse.up();
    const thumbText = await this.sliderCaptchaThumb.textContent();
    console.log(`[SliderCaptcha] Status: ${thumbText}`);
  }

  async uploadAvatar(filePath: string) {
    console.log(`[Upload] Attempting avatar upload: ${filePath}`);
    await this.avatarUploadInput.setInputFiles(filePath);
    console.log(`[Upload] File set successfully: ${filePath}`);
  }

  async isFieldValid(field: RegistrationFieldNames): Promise<boolean> {
    const { valid, message } = await this.fieldLocators[field].evaluate((el) => {
      const input = el as HTMLInputElement;
      return { valid: input.checkValidity(), message: input.validationMessage };
    });
    console.log(`[Validation] ${field}: ${valid ? 'valid' : `invalid — "${message}"`}`);
    return valid;
  }

  async getFieldValidityState(field: RegistrationFieldNames) {
    return this.fieldLocators[field].evaluate((el) => {
      const input = el as HTMLInputElement;
      return {
        valid: input.validity.valid,
        valueMissing: input.validity.valueMissing,
        typeMismatch: input.validity.typeMismatch,
        patternMismatch: input.validity.patternMismatch,
      };
    });
  }

  async getFieldValidationMessage(field: RegistrationFieldNames): Promise<string> {
    return this.fieldLocators[field].evaluate(
      (el) => (el as HTMLInputElement).validationMessage,
    );
  }

  async getErrorMessage() {
    const text = (await this.errorMessage.textContent() ?? '').trim();
    console.log(`[Error] "${text}" is visible`);
    return text;
  }

  async clickSubmit({ expectBrowserError = false, expectServerError = false } = {}) {
    if (expectBrowserError) {
      await this.submitButton.click();
      console.log('[Submit] Browser validation blocked the submit');
      return new SuccessPage(this.page);
    }
    if (expectServerError) {
      await this.submitButton.click();
      await this.getErrorMessage();
      return new SuccessPage(this.page);
    }
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/success')),
      this.submitButton.click(),
    ]);
    if (response.status() !== 200) {
      const errorText = await this.getErrorMessage();
      console.log(`[Submit] Server error: ${errorText}`);
    }
    return new SuccessPage(this.page);
  }

  async registerUser(user: RegistrationUser) {
    await this.fillUserData(user);
    await this.solveSliderCaptcha();
    return await this.clickSubmit();
  }
}
