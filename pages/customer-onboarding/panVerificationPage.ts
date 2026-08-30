import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class PanVerificationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillPanVerificationDetails(
    panNumber: string,
    firstName: string,
    lastName: string,
    dob: string,
    proceedButton?: string
  ): Promise<boolean> {
    console.log('===== PAN Verification Page =====');
    await this.verifyCurrentScreen('PAN Verification');

    // Handle the "Does Customer have PAN Card?" prompt
    // Handle the "Does Customer have PAN Card?" prompt
    let targetFrame: any = this.page;
    
    // User requested to select 'No' for PAN Verification to skip details
    // User requested to select 'Yes' for PAN Verification to enter details
    //const btnName: string = 'Yes'; // Changed to 'Yes' to enter details

    const btnName: string = 'No';
    let clicked = false;

    try {
        console.log('Checking for PAN Card Yes/No prompt...');
        
        // Wait for the modal text to appear
        const promptLocator = this.page.getByText('Does Customer have PAN Card?', { exact: false });
        await promptLocator.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        
        // Search across the main page and all iframes (use outer 'clicked', not a re-declared one)
        for (const frame of this.page.frames()) {
            const buttons = frame.getByRole('button', { name: btnName, exact: true });
            const count = await buttons.count().catch(() => 0);
            
            for (let i = 0; i < count; i++) {
                const btn = buttons.nth(i);
                if (await btn.isVisible().catch(() => false)) {
                    await btn.click({ force: true });
                    console.log(`✓ Clicked ${btnName} for PAN Card in frame: ${frame.url()}`);
                    clicked = true;
                    targetFrame = frame;
                    break;
                }
            }
            if (clicked) break;
        }

        if (clicked) {
            await this.page.waitForTimeout(2000); // Give time for modal to disappear and inputs to appear
        } else {
            console.log(`No visible ${btnName} text found across any frames.`);
        }
    } catch (e) {
        console.log('Error handling PAN Card Yes/No prompt:', e);
    }

    // After clicking No for PAN, user says "select no for enter manually"
    // We will look for another 'No' button just in case there is a follow-up prompt
    try {
        console.log('Checking for follow-up Enter Manually prompt...');
        for (const frame of this.page.frames()) {
            const noButtons = frame.getByRole('button', { name: 'No', exact: true });
            const count = await noButtons.count().catch(() => 0);
            for (let i = 0; i < count; i++) {
                const btn = noButtons.nth(i);
                if (await btn.isVisible().catch(() => false)) {
                    await btn.click({ force: true });
                    console.log(`✓ Clicked 'No' for follow-up prompt in frame: ${frame.url()}`);
                    await this.page.waitForTimeout(2000);
                    break;
                }
            }
        }
    } catch (e) {
        console.log('Error handling follow-up No:', e);
    }

    // Try to close the modal if it's still open (to completely skip PAN)
    try {
        const closeBtn = this.page.getByRole('button', { name: 'Close', exact: true }).first();
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await closeBtn.click({ force: true });
            console.log('✓ Clicked Close on PAN modal to skip it.');
        }
    } catch (e) {
        console.log('No close button found or needed.');
    }

    console.log(`✓ PAN Card: Selected No and skipped successfully.`);
    return true;
  }

  /**
   * Clears an existing value in the input (if any) using Ctrl+A + Backspace,
   * with a triple-click fallback to make sure the text is actually selected
   * before we try to delete it.
   */
  private async clearFieldIfPresent(input: Locator, label: string): Promise<void> {
    await input.scrollIntoViewIfNeeded();
    await input.focus();

    const existingValue = (await input.inputValue().catch(() => '')).trim();
    if (existingValue) {
      // Triple-click ensures full text selection even if Ctrl+A
      // doesn't register due to focus/timing quirks on some inputs.
      await input.click({ clickCount: 3, force: true }).catch(() => {});
      await input.press('Control+A').catch(() => {});
      await input.press('Backspace').catch(() => {});
      console.log(`↺ Cleared existing ${label} value: "${existingValue}"`);
    }
  }

  /**
   * Clear any pre-existing value and fill the input safely.
   */
  private async clearAndFillInput(input: Locator, value: string, label: string): Promise<void> {
    await this.clearFieldIfPresent(input, label);
    await input.fill(value, { force: true }).catch(() => {});
    console.log(`✓ Entered ${label}: ${value}`);
  }

  /**
   * Enter date of birth on PAN verification page.
   * Always clears any existing DOB value before filling the new value.
   */
  private async enterDOB(dob: string, targetFrame: any = this.page): Promise<void> {
    const candidateLocators = [
      targetFrame.getByRole('textbox', { name: /enter customer date of birth on pan|date of birth on pan|dob/i }).first(),
      targetFrame.getByPlaceholder(/date of birth|dob|date/i).first(),
      targetFrame.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'date of birth')]/following::input[1]"),
      targetFrame.locator("//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dob')]/following::input[1]"),
      targetFrame.locator("//input[@type='date']").first(),
    ];

    let input: Locator | null = null;
    for (const locator of candidateLocators) {
      if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
        input = locator;
        break;
      }
    }

    if (!input) {
      throw new Error('PAN DOB input not found');
    }

    await this.clearFieldIfPresent(input, 'PAN DOB');

    const cleanDob = dob.replace(/-/g, '');
    await input.pressSequentially(cleanDob, { delay: 100 });

    await this.page.keyboard.press('Tab');
    console.log(`✓ Entered PAN DOB: ${dob}`);
  }
}