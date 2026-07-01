export enum ErrorMessage {
  // Server-side
  AllFieldsRequired = 'All fields are required!',
  InvalidEmail = 'Invalid email address!',
  PasswordsMismatch = 'Passwords do not match!',
  PasswordTooShort = 'Password must be at least 8 characters long!',
  CaptchaNotSolved = 'Please solve the captcha!',
  FileSizeTooLarge = 'File size must be less than 2 MB.',
  InvalidFileType = 'Invalid image file.',

  // Browser-side (Chromium). Messages contain the input value, so assert via toContain().
  BrowserRequired = 'Please fill out this field.',
  BrowserEmailMissingAt = "Please include an '@' in the email address.",
  BrowserEmailMissingDomain = "Please enter a part following '@'.",
  BrowserEmailDoubleAt = "A part following '@' should not contain the symbol '@'.",
  BrowserEmailSpaceBeforeAt = "A part followed by '@' should not contain the symbol ' '.",
  BrowserEmailSpaceAfterAt = "A part following '@' should not contain the symbol ' '.",
}
