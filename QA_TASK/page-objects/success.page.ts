import { Locator, Page } from '@playwright/test';

export class SuccessPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly lastSubmission: Locator;
  readonly avatarImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading');
    this.lastSubmission = page.locator('ul > li').last();
    this.avatarImage = page.getByAltText('Avatar');
  }

  async getSubmissionText() {
    console.log(`[Success] Success page reached: ${this.page.url()}`);
    return (await this.lastSubmission.textContent() ?? '').trim();
  }

  async getAvatarExtension() {
    const src = await this.avatarImage.getAttribute('src') ?? '';
    return src.substring(src.lastIndexOf('.')).toLowerCase();
  }
}
