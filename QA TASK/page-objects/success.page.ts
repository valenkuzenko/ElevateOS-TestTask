import { Locator, Page } from '@playwright/test';

export class SuccessPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submissionName: Locator;
  readonly submissionEmail: Locator;
  readonly submissionAvatar: Locator;
  readonly avatarImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Successful Form Submissions' });
    this.submissionName = page.locator('li strong', { hasText: 'Name:' });
    this.submissionEmail = page.locator('li strong', { hasText: 'Email:' });
    this.submissionAvatar = page.locator('li strong', { hasText: 'Avatar:' });
    this.avatarImage = page.getByAltText('Avatar');
  }

  async getSubmissionText() {
    console.log(`[Success] Success page reached: ${this.page.url()}`);
    return (await this.page.locator('ul > li').last().textContent() ?? '').trim();
  }

  async getAvatarExtension() {
    const src = await this.avatarImage.getAttribute('src') ?? '';
    return src.substring(src.lastIndexOf('.')).toLowerCase();
  }
}
